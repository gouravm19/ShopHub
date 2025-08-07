import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

export default function SeedButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const seedDatabase = useMutation(api.seedData.seedDatabase);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDatabase({});
      toast.success(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to seed database");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={isSeeding}
      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
    >
      {isSeeding ? "Seeding..." : "Seed Sample Data"}
    </button>
  );
}
