/**
 * examples/demo.ts
 *
 * Run with:  npx tsx examples/demo.ts
 *
 * Demonstrates MongoDB CRUD operations tracked with the step logger.
 * Note: This is a simulated example. For real MongoDB, install: npm install mongodb
 */
import { autoStep, summary, reset } from "../src/index.js";

// ── Simulated MongoDB Operations ──────────────────────────────────
// In a real app, you'd: import { MongoClient } from "mongodb";
interface User {
	_id?: string;
	name: string;
	email: string;
	age: number;
}

const database: Map<string, User> = new Map();
let nextId = 1;

function generateId(): string {
	return `user_${nextId++}`;
}

// Simulated DB: Create
async function createUser(user: Omit<User, "_id">): Promise<User> {
	const id = generateId();
	const newUser = { _id: id, ...user };
	database.set(id, newUser);
	return newUser;
}

// Simulated DB: Read
async function findUser(email: string): Promise<User | null> {
	for (const user of database.values()) {
		if (user.email === email) return user;
	}
	return null;
}

// Simulated DB: Update
async function updateUser(id: string, updates: Partial<User>): Promise<boolean> {
	const user = database.get(id);
	if (!user) return false;
	Object.assign(user, updates);
	database.set(id, user);
	return true;
}

// Simulated DB: Delete
async function deleteUser(id: string): Promise<boolean> {
	return database.delete(id);
}

// ── Main CRUD Demo ───────────────────────────────────────────────
async function mongoCrudDemo() {
	reset();
	console.log("\n" + "█".repeat(70));
	console.log("MongoDB CRUD Operations with log-step");
	console.log("█".repeat(70) + "\n");

	// Step 1: Connect to Database
	const connect = autoStep("Connect to MongoDB");
	connect.pass();

	// Step 2: Create Operations
	const createOps = autoStep("Create Users");

	const create1 = createOps.sub(1, "Create Alice");
	const alice = await createUser({ name: "Alice", email: "alice@example.com", age: 28 });
	create1.pass(`ID: ${alice._id}`);

	const create2 = createOps.sub(2, "Create Bob");
	const bob = await createUser({ name: "Bob", email: "bob@example.com", age: 35 });
	create2.pass(`ID: ${bob._id}`);

	const create3 = createOps.sub(3, "Create Carol");
	const carol = await createUser({
		name: "Carol",
		email: "carol@example.com",
		age: 32,
	});
	create3.pass(`ID: ${carol._id}`);

	createOps.pass("3 users created");

	// Step 3: Read Operations
	const readOps = autoStep("Read Users");

	const read1 = readOps.sub(1, "Find Alice");
	const foundAlice = await findUser("alice@example.com");
	if (foundAlice) {
		read1.pass(`Found: ${foundAlice.name}`);
	} else {
		read1.fail("Not found");
	}

	const read2 = readOps.sub(2, "Find Unknown User");
	const notFound = await findUser("unknown@example.com");
	if (!notFound) {
		read2.warn("User not found");
	} else {
		read2.fail("Should not exist");
	}

	readOps.pass("Read operations completed");

	// Step 4: Update Operations
	const updateOps = autoStep("Update Users");

	const update1 = updateOps.sub(1, "Update Alice age");
	const success = await updateUser(alice._id!, { age: 29 });
	if (success) {
		update1.pass("Age updated to 29");
	} else {
		update1.fail("Update failed");
	}

	const update2 = updateOps.sub(2, "Update Bob email");
	const success2 = await updateUser(bob._id!, { email: "bob.smith@example.com" });
	if (success2) {
		update2.pass("Email updated");
	} else {
		update2.fail("Update failed");
	}

	updateOps.pass("2 users updated");

	// Step 5: Delete Operations
	const deleteOps = autoStep("Delete Users");

	const del1 = deleteOps.sub(1, "Delete Carol");
	const deleted = await deleteUser(carol._id!);
	if (deleted) {
		del1.pass("Carol removed");
	} else {
		del1.fail("Deletion failed");
	}

	const del2 = deleteOps.sub(2, "Attempt delete non-existent");
	const failed = await deleteUser("invalid_id");
	if (!failed) {
		del2.warn("User already deleted");
	}

	deleteOps.pass("Delete operations completed");

	// Step 6: Disconnect
	const disconnect = autoStep("Disconnect from MongoDB");
	disconnect.pass();

	// ── Final Summary ────────────────────────────────────────────
	summary();

	// ── Summary of remaining data ────────────────────────────────
	console.log("\n── Final Database State ──");
	console.log(`Total users: ${database.size}`);
	database.forEach((user) => {
		console.log(`  • ${user.name} (${user.email})`);
	});
}

mongoCrudDemo().catch(console.error);
