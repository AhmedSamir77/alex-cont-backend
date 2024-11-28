import mongoose from "mongoose"; // Ensure mongoose is imported

const containerSchema = new mongoose.Schema(
  {
    containerNumber: { type: String, required: true },
    holdTypes: [
      {
        type: { type: String, required: true },
        status: { type: Boolean, default: true },
        dateAdded: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

export const Container = mongoose.model("Container", containerSchema); // Example named export
