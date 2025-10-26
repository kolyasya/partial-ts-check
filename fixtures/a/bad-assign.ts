// Intentional error: type mismatch
const n: number = "not a number";

// Intentional error: object type mismatch with multiple properties
interface UserProfile {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

const user: UserProfile = {
  id: "123", // should be number
  name: 456, // should be string
  email: true, // should be string
  age: "thirty", // should be number
  isActive: "yes" // should be boolean
};

// Intentional error: incorrect function signature
function processData(input: string, options: { verbose: boolean; retries: number }): Promise<string> {
  return 42; // should return Promise<string>
}

// Intentional error: array type mismatch
const numbers: number[] = [1, 2, "three", 4, "five"];

// Intentional error: complex reduce with type mismatch
interface Transaction {
  id: string;
  amount: number;
  category: string;
}

const transactions: Transaction[] = [
  { id: "1", amount: 100, category: "food" },
  { id: "2", amount: 50, category: "transport" },
  { id: "3", amount: 200, category: "food" }
];

// This reduce has multiple type errors
const summary = transactions.reduce((acc, transaction) => {
  const category = transaction.category;
  // Error: trying to assign number to string
  acc[category] = acc[category] ? acc[category] + transaction.amount : "initial";
  // Error: trying to add incompatible types
  acc.total = acc.total + transaction.id;
  return acc;
}, { total: 0 });

export default n;
