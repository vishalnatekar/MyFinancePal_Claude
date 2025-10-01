import { cn } from "@/lib/utils";

describe("cn utility function", () => {
	it("should merge class names correctly", () => {
		expect(cn("class1", "class2")).toBe("class1 class2");
	});

	it("should handle conditional classes", () => {
		expect(cn("class1", false && "class2", "class3")).toBe("class1 class3");
	});

	it("should deduplicate classes", () => {
		expect(cn("p-4 p-2")).toBe("p-2");
	});

	it("should handle empty inputs", () => {
		expect(cn()).toBe("");
		expect(cn("", null, undefined)).toBe("");
	});

	it("should merge tailwind classes correctly", () => {
		expect(cn("bg-red-500 bg-blue-500")).toBe("bg-blue-500");
		expect(cn("px-4 py-2 px-6")).toBe("py-2 px-6");
	});
});
