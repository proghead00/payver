import { MongoClient } from "mongodb";

async function deleteAllNotifications() {
  const uri =
    "mongodb+srv://susnatadjrocks:FlxvPAaOVXAXDArr@cluster0.xetvo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB connection string
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("test"); // Replace with y<our actual DB name
    const result = await db.collection("notifications").deleteMany({});

    console.log(`Deleted ${result.deletedCount} docs.`);
  } catch (error) {
    console.error("Error deleting notifications:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

deleteAllNotifications();
