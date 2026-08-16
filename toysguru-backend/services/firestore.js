export async function getApprovedListings(env) {
    return [
        {
            id: "demo1",
            lotNumber: "TG-000001",
            name: "Nissan Skyline GT-R",
            brand: "Hot Wheels",
            series: "Premium",
            price: "₹999",
            grade: "MOC",
            featured: true
        },
        {
            id: "demo2",
            lotNumber: "TG-000002",
            name: "Toyota Supra",
            brand: "Hot Wheels",
            series: "Boulevard",
            price: "₹799",
            grade: "Near Mint",
            featured: false
        }
    ];
}