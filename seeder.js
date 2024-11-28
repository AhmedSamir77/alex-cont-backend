import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/users.js"; // Ensure the path is correct

dotenv.config();

const seedUsers = async () => {
  try {
    // Hash the passwords for each user using bcrypt
    const hashedPassword1 = await bcrypt.hash("alexcont@1010", 10);
    const hashedPassword2 = await bcrypt.hash("alexcont@2020", 10);
    const hashedPassword3 = await bcrypt.hash("alexcont@3030", 10);
    const hashedPassword4 = await bcrypt.hash("adminit@1234", 10);

    console.log("Hashed password for user 1:", hashedPassword1);
    console.log("Hashed password for user 2:", hashedPassword2);
    console.log("Hashed password for user 3:", hashedPassword3);

    // Create the users
    const users = [
      {
        username: "yard1",
        password: hashedPassword1, // Store the hashed password
      },
      {
        username: "yard2",
        password: hashedPassword2, // Store the hashed password
      },
      {
        username: "yard3",
        password: hashedPassword3, // Store the hashed password
      },
      {
        username: "admin",
        password: hashedPassword4, // Store the hashed password
      },
    ];

    // Insert the users into the database
    await User.insertMany(users);
    console.log("Users added!");

    // Close the connection after seeding
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding users:", error);
    mongoose.connection.close();
  }
};

// Connect to MongoDB and seed the users
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected for seeding...");
    seedUsers();
  })
  .catch((error) => console.log("Error connecting to MongoDB:", error));
