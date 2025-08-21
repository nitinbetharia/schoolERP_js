// Quick test for systemServices
const systemServices = require("./services/systemServices");

console.log("systemServices loaded successfully:", Object.keys(systemServices));
console.log("systemAuthService available:", !!systemServices.systemAuthService);
console.log("trustService available:", !!systemServices.trustService);

if (systemServices.systemAuthService) {
  console.log(
    "systemAuthService methods:",
    Object.keys(systemServices.systemAuthService),
  );
}

if (systemServices.trustService) {
  console.log(
    "trustService methods:",
    Object.keys(systemServices.trustService),
  );
}
