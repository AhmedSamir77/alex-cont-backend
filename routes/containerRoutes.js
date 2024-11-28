import express from "express";
import { Container } from "../models/containers.js"; // Use named import
import { authenticate } from "../middlewares/auth.js"; // Add .js extension if you're using ES Modules

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  const { status, page, pageSize } = req.query;

  try {
    let query = {};

    // Filter based on holdType status if provided
    if (status === "true") {
      query = { holdTypes: { $elemMatch: { status: true } } };
    } else if (status === "false") {
      query = {
        $and: [
          { holdTypes: { $exists: true, $ne: [] } }, // Ensure holdTypes array is not empty
          { holdTypes: { $not: { $elemMatch: { status: true } } } }, // No holdTypes with status: true
        ],
      };
    }

    // Check if pagination parameters are provided
    if (page && pageSize) {
      const pageNum = parseInt(page, 10) || 1; // Default to page 1
      const pageLimit = parseInt(pageSize, 10) || 10; // Default to 10 items per page

      const containers = await Container.find(query)
        .skip((pageNum - 1) * pageLimit) // Skip documents for previous pages
        .limit(pageLimit) // Limit the number of documents per page
        .populate("holdTypes.addedBy", "-password") // Populate addedBy field inside holdTypes array
        .populate("holdTypes.updatedBy", "-password"); // Populate updatedBy field inside holdTypes array

      // Get total count for pagination info
      const total = await Container.countDocuments(query);

      return res.json({
        containers,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / pageLimit),
      });
    }

    // No pagination: return all containers
    const containers = await Container.find(query)
      .populate("holdTypes.addedBy", "-password") // Populate addedBy field inside holdTypes array
      .populate("holdTypes.updatedBy", "-password"); // Populate updatedBy field inside holdTypes array
    res.json(containers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a container
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await Container.findOneAndDelete({ _id: req.params.id });
    res.json({ message: "Container deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting container", error });
  }
});

router.put("/:id/add-holdtype", authenticate, async (req, res) => {
  const { holdType } = req.body;

  if (!holdType) {
    return res.status(400).json({ error: "Hold type is required" });
  }

  try {
    let container = await Container.findOne({
      containerNumber: req.params.id,
    });

    // If container is not found, create a new container
    if (!container) {
      container = new Container({
        containerNumber: req.params.id, // Using containerNumber from the URL parameter
        holdTypes: [
          {
            type: holdType,
            status: true,
            addedBy: req.user.id, // Get addedBy from the token
            dateAdded: Date.now(),
          },
        ],
        // Add other fields as necessary
      });
    } else {
      // Check if a holdType with the same type and status true already exists in the container
      const existingActiveHoldType = container.holdTypes.find(
        (ht) => ht.type === holdType && ht.status === true
      );

      if (existingActiveHoldType) {
        return res
          .status(400)
          .json({ error: "Hold type with status true already exists" });
      }

      // Check if the holdType exists with status false (disabled)
      const existingDisabledHoldType = container.holdTypes.find(
        (ht) => ht.type === holdType && ht.status === false
      );

      if (existingDisabledHoldType) {
        // If found, just push the new holdType with status true
        container.holdTypes.push({
          type: holdType,
          status: true, // Set the new status to true
          addedBy: req.user.id, // Get addedBy from the token
          dateAdded: Date.now(), // Add the timestamp
        });
      } else {
        // If the holdType doesn't exist at all, add a new entry
        container.holdTypes.push({
          type: holdType,
          status: true, // Initially set to active (true)
          addedBy: req.user.id, // Get addedBy from the token
          dateAdded: Date.now(), // Add the timestamp
        });
      }
    }

    // Save the container (whether it's newly created or updated)
    await container.save();

    res.json(container); // Return the updated container
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/disable-holdtype", authenticate, async (req, res) => {
  const { holdType } = req.body;

  if (!holdType) {
    return res.status(400).json({ error: "Hold type is required" });
  }

  try {
    const container = await Container.findOne({ _id: req.params.id });

    if (!container) {
      return res.status(404).json({ error: "Container not found" });
    }

    // Find the active holdType within the container
    const holdTypeIndex = container.holdTypes.findIndex(
      (ht) => ht.type === holdType && ht.status === true
    );

    if (holdTypeIndex === -1) {
      return res
        .status(400)
        .json({ error: "Hold type is not active or doesn't exist" });
    }

    // Disable the holdType by setting status to false
    container.holdTypes[holdTypeIndex].status = false;
    container.holdTypes[holdTypeIndex].updatedBy = req.user.id; // Set updatedBy to the current user
    container.holdTypes[holdTypeIndex].dateUpdated = Date.now(); // Add the timestamp for update

    // Save the updated container
    await container.save();

    res.json(container); // Return the updated container
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
