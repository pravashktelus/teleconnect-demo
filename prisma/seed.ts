import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create internal staff users (one per app)
  const crmPass = await bcrypt.hash("crm123", 10);
  const installPass = await bcrypt.hash("install123", 10);
  const activationPass = await bcrypt.hash("activation123", 10);

  await prisma.user.upsert({
    where: { email: "crm@telecom.com" },
    update: {},
    create: { name: "CRM Agent", email: "crm@telecom.com", password: crmPass, role: "CRM" },
  });

  await prisma.user.upsert({
    where: { email: "install@telecom.com" },
    update: {},
    create: { name: "Installation Tech", email: "install@telecom.com", password: installPass, role: "INSTALLATION" },
  });

  await prisma.user.upsert({
    where: { email: "activation@telecom.com" },
    update: {},
    create: { name: "Activation Tech", email: "activation@telecom.com", password: activationPass, role: "ACTIVATION" },
  });

  // Service Areas - Many states and cities across India
  const areas = [
    // Maharashtra
    { state: "Maharashtra", city: "Mumbai", area: "Andheri West", pincode: "400053", lat: 19.1364, lng: 72.8296 },
    { state: "Maharashtra", city: "Mumbai", area: "Bandra East", pincode: "400051", lat: 19.0596, lng: 72.8495 },
    { state: "Maharashtra", city: "Mumbai", area: "Powai", pincode: "400076", lat: 19.1176, lng: 72.9060 },
    { state: "Maharashtra", city: "Mumbai", area: "Worli", pincode: "400018", lat: 19.0176, lng: 72.8150 },
    { state: "Maharashtra", city: "Mumbai", area: "Malad West", pincode: "400064", lat: 19.1867, lng: 72.8484 },
    { state: "Maharashtra", city: "Pune", area: "Koregaon Park", pincode: "411001", lat: 18.5362, lng: 73.8930 },
    { state: "Maharashtra", city: "Pune", area: "Hinjewadi", pincode: "411057", lat: 18.5912, lng: 73.7390 },
    { state: "Maharashtra", city: "Pune", area: "Kothrud", pincode: "411038", lat: 18.5074, lng: 73.8077 },
    { state: "Maharashtra", city: "Nagpur", area: "Dharampeth", pincode: "440010", lat: 21.1458, lng: 79.0882 },
    { state: "Maharashtra", city: "Nagpur", area: "Sadar", pincode: "440001", lat: 21.1500, lng: 79.0800 },
    // Delhi NCR
    { state: "Delhi", city: "Delhi", area: "Connaught Place", pincode: "110001", lat: 28.6315, lng: 77.2167 },
    { state: "Delhi", city: "Delhi", area: "Dwarka", pincode: "110075", lat: 28.5921, lng: 77.0460 },
    { state: "Delhi", city: "Delhi", area: "Rohini", pincode: "110085", lat: 28.7495, lng: 77.0565 },
    { state: "Delhi", city: "Delhi", area: "Saket", pincode: "110017", lat: 28.5244, lng: 77.2066 },
    { state: "Uttar Pradesh", city: "Noida", area: "Sector 62", pincode: "201301", lat: 28.6270, lng: 77.3650 },
    { state: "Uttar Pradesh", city: "Noida", area: "Sector 18", pincode: "201301", lat: 28.5706, lng: 77.3219 },
    { state: "Uttar Pradesh", city: "Noida", area: "Sector 44", pincode: "201303", lat: 28.5800, lng: 77.3300 },
    { state: "Uttar Pradesh", city: "Noida", area: "Sector 128", pincode: "201304", lat: 28.5100, lng: 77.3700 },
    { state: "Uttar Pradesh", city: "Noida", area: "Greater Noida West", pincode: "201306", lat: 28.5700, lng: 77.4500 },
    { state: "Haryana", city: "Gurgaon", area: "DLF Phase 3", pincode: "122002", lat: 28.4940, lng: 77.0930 },
    { state: "Haryana", city: "Gurgaon", area: "Sohna Road", pincode: "122018", lat: 28.4150, lng: 77.0430 },
    // Karnataka
    { state: "Karnataka", city: "Bangalore", area: "Koramangala", pincode: "560034", lat: 12.9352, lng: 77.6245 },
    { state: "Karnataka", city: "Bangalore", area: "Whitefield", pincode: "560066", lat: 12.9698, lng: 77.7500 },
    { state: "Karnataka", city: "Bangalore", area: "Indiranagar", pincode: "560038", lat: 12.9784, lng: 77.6408 },
    { state: "Karnataka", city: "Bangalore", area: "HSR Layout", pincode: "560102", lat: 12.9116, lng: 77.6474 },
    { state: "Karnataka", city: "Bangalore", area: "Electronic City", pincode: "560100", lat: 12.8399, lng: 77.6770 },
    // Tamil Nadu
    { state: "Tamil Nadu", city: "Chennai", area: "T Nagar", pincode: "600017", lat: 13.0418, lng: 80.2341 },
    { state: "Tamil Nadu", city: "Chennai", area: "Adyar", pincode: "600020", lat: 13.0067, lng: 80.2572 },
    { state: "Tamil Nadu", city: "Chennai", area: "Velachery", pincode: "600042", lat: 12.9815, lng: 80.2180 },
    { state: "Tamil Nadu", city: "Chennai", area: "OMR", pincode: "600119", lat: 12.9100, lng: 80.2279 },
    // Telangana
    { state: "Telangana", city: "Hyderabad", area: "Hitech City", pincode: "500081", lat: 17.4435, lng: 78.3772 },
    { state: "Telangana", city: "Hyderabad", area: "Gachibowli", pincode: "500032", lat: 17.4401, lng: 78.3489 },
    { state: "Telangana", city: "Hyderabad", area: "Banjara Hills", pincode: "500034", lat: 17.4156, lng: 78.4347 },
    { state: "Telangana", city: "Hyderabad", area: "Madhapur", pincode: "500081", lat: 17.4483, lng: 78.3915 },
    // West Bengal
    { state: "West Bengal", city: "Kolkata", area: "Salt Lake", pincode: "700091", lat: 22.5800, lng: 88.4200 },
    { state: "West Bengal", city: "Kolkata", area: "Park Street", pincode: "700016", lat: 22.5510, lng: 88.3530 },
    { state: "West Bengal", city: "Kolkata", area: "New Town", pincode: "700156", lat: 22.5958, lng: 88.4795 },
    // Gujarat
    { state: "Gujarat", city: "Ahmedabad", area: "SG Highway", pincode: "380054", lat: 23.0225, lng: 72.5714 },
    { state: "Gujarat", city: "Ahmedabad", area: "Vastrapur", pincode: "380015", lat: 23.0300, lng: 72.5300 },
    { state: "Gujarat", city: "Ahmedabad", area: "Prahlad Nagar", pincode: "380015", lat: 23.0130, lng: 72.5120 },
    // Rajasthan
    { state: "Rajasthan", city: "Jaipur", area: "Malviya Nagar", pincode: "302017", lat: 26.8600, lng: 75.8100 },
    { state: "Rajasthan", city: "Jaipur", area: "C-Scheme", pincode: "302001", lat: 26.9124, lng: 75.7873 },
    // Kerala
    { state: "Kerala", city: "Kochi", area: "Edappally", pincode: "682024", lat: 10.0261, lng: 76.3125 },
    { state: "Kerala", city: "Kochi", area: "Kakkanad", pincode: "682030", lat: 10.0159, lng: 76.3419 },
    // Uttar Pradesh
    { state: "Uttar Pradesh", city: "Lucknow", area: "Gomti Nagar", pincode: "226010", lat: 26.8563, lng: 81.0090 },
    { state: "Uttar Pradesh", city: "Lucknow", area: "Hazratganj", pincode: "226001", lat: 26.8500, lng: 80.9500 },
  ];

  for (const area of areas) {
    await prisma.serviceArea.upsert({
      where: { city_area_pincode: { city: area.city, area: area.area, pincode: area.pincode } },
      update: { state: area.state, lat: area.lat, lng: area.lng },
      create: { ...area, isActive: true },
    });
  }

  // Plans
  const plans = [
    { name: "Entertainment", speed: "100 Mbps", price: 699, description: "Streaming & browsing", features: JSON.stringify(["100 Mbps speed", "Unlimited data", "OTT apps included", "HD streaming"]) },
    { name: "WiFi + Phone", speed: "200 Mbps", price: 899, description: "Internet with landline", features: JSON.stringify(["200 Mbps speed", "Unlimited data", "Free landline calls", "Local + STD free"]) },
    { name: "WiFi + Entertainment", speed: "300 Mbps", price: 1199, description: "Fast internet with OTT", features: JSON.stringify(["300 Mbps speed", "Unlimited data", "All OTT apps", "4K streaming", "Gaming optimized"]) },
    { name: "All-in-One", speed: "1 Gbps", price: 1999, description: "Everything unlimited", features: JSON.stringify(["1 Gbps speed", "Unlimited data", "All OTT apps", "Free landline", "Priority support", "Static IP"]) },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.name.toLowerCase().replace(/[^a-z0-9]/g, "-") },
      update: {},
      create: { id: plan.name.toLowerCase().replace(/[^a-z0-9]/g, "-"), ...plan },
    });
  }

  // Offers
  const offers = [
    { code: "WELCOME20", name: "Welcome Offer - 20% Off", discount: 20, discountType: "PERCENTAGE" },
    { code: "FLAT200", name: "Flat ₹200 Off", discount: 200, discountType: "FLAT" },
    { code: "FIRST3FREE", name: "First 3 Months Free Installation", discount: 0, discountType: "FLAT" },
  ];

  for (const offer of offers) {
    await prisma.offer.upsert({
      where: { code: offer.code },
      update: {},
      create: { ...offer, isActive: true },
    });
  }

  console.log("Seed complete!");
  console.log("  CRM: crm@telecom.com / crm123");
  console.log("  Installation: install@telecom.com / install123");
  console.log("  Activation: activation@telecom.com / activation123");
  console.log("  Customers: Register via the app");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
