import mongoose from "mongoose";

export async function connectToDB(url:string) {
  try {
    console.log("Connecting to the database..");
    await mongoose.connect(url, {
      autoIndex: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("Connected to the database");
    mongoose.connection.on("error", (err) => {
      console.error("Database connection error: ", err);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("Database connection lost. Reconnecting...");
      connectToDB(url);
    });
  } catch (error) {
    console.error("Error connecting to the database: ", error);
    process.exit(1); // Exit the process with failure
  }
}

export async function disconnectFromDataBase() {
  await mongoose.connection.close();
  console.log("Disconnected from the database");
  return;
}
