export interface SeededMasterCatalogItem {
  label: string
  value: string
  aliases?: string[]
}

export interface SeededIndustryDependencyBlueprint {
  industryLabel: string
  industryValue: string
  businessTypeLabels: string[]
  labourCategoryLabels: string[]
}

export interface SeededCategoryCatalogItem {
  id: string
  label: string
  slug: string
  description: string
  demandLevel: 'high' | 'medium' | 'low'
  aliases?: string[]
}

const slugifySeedText = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toSeedCategoryId = (label: string) => {
  const legacyIds: Record<string, string> = {
    'Stitching Karighar': 'cat-stitching',
    'Embroidery Worker': 'cat-embroidery',
    Electrician: 'cat-electrician',
    'Printer Labour': 'cat-printer-labour'
  }

  return legacyIds[label] || `cat-${slugifySeedText(label) || 'category'}`
}

export const seededIndustryCategoryCatalog: SeededMasterCatalogItem[] = [
  { label: 'Textile & Garments', value: 'textile_garments', aliases: ['Textile'] },
  { label: 'Construction & Infrastructure', value: 'construction_infrastructure', aliases: ['Construction'] },
  { label: 'Manufacturing & Production', value: 'manufacturing_production', aliases: ['Manufacturing'] },
  { label: 'Factory Operations', value: 'factory_operations', aliases: ['Factory'] },
  { label: 'Warehousing & Logistics', value: 'warehousing_logistics', aliases: ['Warehouse', 'Logistics'] },
  { label: 'Transport & Delivery', value: 'transport_delivery', aliases: ['Delivery', 'Transport'] },
  { label: 'Retail & FMCG', value: 'retail_fmcg' },
  { label: 'Wholesale & Distribution', value: 'wholesale_distribution' },
  { label: 'Hotel / Restaurant / Catering', value: 'hotel_restaurant_catering', aliases: ['Hospitality'] },
  { label: 'Housekeeping & Facility Management', value: 'housekeeping_facility_management' },
  { label: 'Security Services', value: 'security_services' },
  { label: 'Food Processing', value: 'food_processing' },
  { label: 'Packaging Industry', value: 'packaging_industry' },
  { label: 'Agriculture & Farming', value: 'agriculture_farming' },
  { label: 'Real Estate & Interior Work', value: 'real_estate_interior_work' },
  { label: 'Furniture & Woodwork', value: 'furniture_woodwork' },
  { label: 'Metal Fabrication', value: 'metal_fabrication' },
  { label: 'Plastic & Rubber Industry', value: 'plastic_rubber_industry' },
  { label: 'Automobile / Workshop', value: 'automobile_workshop' },
  { label: 'Electrical & Electronics', value: 'electrical_electronics' },
  { label: 'Printing & Signage', value: 'printing_signage' },
  { label: 'Healthcare & Hospital Services', value: 'healthcare_hospital_services' },
  { label: 'Education / Institution Services', value: 'education_institution_services' },
  { label: 'E-commerce Operations', value: 'ecommerce_operations' },
  { label: 'Event Management / Tent House', value: 'event_management_tent_house' },
  { label: 'Domestic / Household Services', value: 'domestic_household_services' },
  { label: 'Beauty & Wellness', value: 'beauty_wellness' },
  { label: 'Cleaning & Sanitation', value: 'cleaning_sanitation' },
  { label: 'Repair & Maintenance', value: 'repair_maintenance' },
  { label: 'Mining / Quarry / Heavy Work', value: 'mining_quarry_heavy_work' }
]

export const seededBusinessTypeCatalog: SeededMasterCatalogItem[] = [
  { label: 'Manufacturer', value: 'manufacturer' },
  { label: 'Factory / Industrial Unit', value: 'factory_industrial_unit', aliases: ['Factory'] },
  { label: 'Construction Contractor', value: 'construction_contractor', aliases: ['Construction Company'] },
  { label: 'Labour Contractor', value: 'labour_contractor', aliases: ['Contractor'] },
  { label: 'Service Provider', value: 'service_provider' },
  { label: 'Facility Management Company', value: 'facility_management_company' },
  { label: 'Security Agency', value: 'security_agency' },
  { label: 'Cleaning / Housekeeping Agency', value: 'cleaning_housekeeping_agency' },
  { label: 'Warehouse / Logistics Operator', value: 'warehouse_logistics_operator', aliases: ['Warehouse', 'Logistics'] },
  { label: 'Transport Company', value: 'transport_company' },
  { label: 'Retailer', value: 'retailer' },
  { label: 'Wholesaler', value: 'wholesaler' },
  { label: 'Distributor', value: 'distributor' },
  { label: 'Hotel / Restaurant / Catering Business', value: 'hotel_restaurant_catering_business', aliases: ['Hospitality'] },
  { label: 'Agriculture / Farm Business', value: 'agriculture_farm_business' },
  { label: 'Real Estate Developer', value: 'real_estate_developer' },
  { label: 'Interior Contractor', value: 'interior_contractor' },
  { label: 'Workshop / Garage', value: 'workshop_garage' },
  { label: 'E-commerce Seller', value: 'ecommerce_seller' },
  { label: 'Healthcare Facility', value: 'healthcare_facility' },
  { label: 'Educational Institution', value: 'educational_institution' },
  { label: 'Event Management Company', value: 'event_management_company' },
  { label: 'Tent House / Decoration Contractor', value: 'tent_house_decoration_contractor' },
  { label: 'Domestic Service Provider', value: 'domestic_service_provider' },
  { label: 'Beauty / Wellness Centre', value: 'beauty_wellness_centre' },
  { label: 'Mining / Heavy Work Contractor', value: 'mining_heavy_work_contractor' },
  { label: 'Export / Production Unit', value: 'export_production_unit', aliases: ['Textile Business'] },
  { label: 'Infrastructure Contractor', value: 'infrastructure_contractor' },
  { label: 'Food Processing Unit', value: 'food_processing_unit' },
  { label: 'Printing / Signage Company', value: 'printing_signage_company' },
  { label: 'Salon / Spa Business', value: 'salon_spa_business' }
]

export const seededIndustryDependencyBlueprints: SeededIndustryDependencyBlueprint[] = [
  {
    industryLabel: 'Textile & Garments',
    industryValue: 'textile_garments',
    businessTypeLabels: ['Manufacturer', 'Factory / Industrial Unit', 'Labour Contractor', 'Export / Production Unit'],
    labourCategoryLabels: ['Stitching Karighar', 'Tailor', 'Cutting Master', 'Embroidery Worker', 'Adda Work Karighar', 'Zari Work Karighar', 'Sampling Master', 'Pattern Master', 'Sewing Machine Operator', 'Overlock Machine Operator', 'Pressman / Ironing Worker', 'Garment Checker', 'Thread Cutter', 'Finishing Worker', 'Packing Worker', 'Production Manager', 'Helper']
  },
  {
    industryLabel: 'Construction & Infrastructure',
    industryValue: 'construction_infrastructure',
    businessTypeLabels: ['Construction Contractor', 'Labour Contractor', 'Real Estate Developer', 'Infrastructure Contractor'],
    labourCategoryLabels: ['Mason', 'Construction Helper', 'Civil Supervisor', 'Bar Bender', 'Shuttering Carpenter', 'Painter', 'Plumber', 'Electrician', 'Tile Fitter', 'POP Worker', 'Welder', 'JCB Operator', 'Crane Operator', 'Site Cleaner', 'Safety Supervisor', 'Labour Supervisor']
  },
  {
    industryLabel: 'Manufacturing & Production',
    industryValue: 'manufacturing_production',
    businessTypeLabels: ['Manufacturer', 'Factory / Industrial Unit', 'Labour Contractor'],
    labourCategoryLabels: ['Machine Operator', 'Production Worker', 'Assembly Line Worker', 'Factory Helper', 'Quality Checker', 'Production Supervisor', 'Packer', 'Loader', 'Material Handler', 'Maintenance Technician', 'Store Keeper', 'CNC Operator', 'Welder', 'Fitter', 'Helper']
  },
  {
    industryLabel: 'Factory Operations',
    industryValue: 'factory_operations',
    businessTypeLabels: ['Factory / Industrial Unit', 'Labour Contractor', 'Manufacturer'],
    labourCategoryLabels: ['Factory Worker', 'Shift Supervisor', 'Machine Operator', 'Helper', 'Loader', 'Packer', 'Line Operator', 'Quality Inspector', 'Store Assistant', 'Dispatch Worker', 'Housekeeping Staff', 'Security Guard', 'Maintenance Helper']
  },
  {
    industryLabel: 'Warehousing & Logistics',
    industryValue: 'warehousing_logistics',
    businessTypeLabels: ['Warehouse / Logistics Operator', 'Labour Contractor', 'Distributor', 'E-commerce Seller'],
    labourCategoryLabels: ['Warehouse Helper', 'Picker', 'Packer', 'Loader', 'Unloader', 'Inventory Assistant', 'Forklift Operator', 'Dispatch Executive', 'Delivery Boy', 'Sorting Staff', 'Barcode Scanner Operator', 'Warehouse Supervisor', 'Data Entry Operator']
  },
  {
    industryLabel: 'Transport & Delivery',
    industryValue: 'transport_delivery',
    businessTypeLabels: ['Transport Company', 'Service Provider', 'Labour Contractor', 'E-commerce Seller'],
    labourCategoryLabels: ['Driver', 'Delivery Boy', 'Loader', 'Transport Helper', 'Tempo Driver', 'Truck Driver', 'Bike Rider', 'Dispatch Coordinator', 'Fleet Supervisor', 'Vehicle Cleaner', 'Route Assistant', 'Courier Executive']
  },
  {
    industryLabel: 'Retail & FMCG',
    industryValue: 'retail_fmcg',
    businessTypeLabels: ['Retailer', 'Distributor', 'Wholesaler', 'Service Provider'],
    labourCategoryLabels: ['Sales Staff', 'Store Helper', 'Billing Staff', 'Cashier', 'Stock Boy', 'Merchandiser', 'Delivery Boy', 'Promoter', 'Shelf Loader', 'Store Supervisor', 'Packing Helper', 'Counter Sales Executive']
  },
  {
    industryLabel: 'Wholesale & Distribution',
    industryValue: 'wholesale_distribution',
    businessTypeLabels: ['Wholesaler', 'Distributor', 'Warehouse / Logistics Operator', 'Labour Contractor'],
    labourCategoryLabels: ['Godown Helper', 'Loader', 'Packer', 'Billing Assistant', 'Stock Manager', 'Delivery Helper', 'Dispatch Worker', 'Inventory Assistant', 'Sales Coordinator', 'Data Entry Operator', 'Warehouse Supervisor']
  },
  {
    industryLabel: 'Hotel / Restaurant / Catering',
    industryValue: 'hotel_restaurant_catering',
    businessTypeLabels: ['Hotel / Restaurant / Catering Business', 'Service Provider', 'Labour Contractor'],
    labourCategoryLabels: ['Cook', 'Chef', 'Kitchen Helper', 'Waiter', 'Steward', 'Cleaner', 'Dishwasher', 'Housekeeping Staff', 'Catering Helper', 'Counter Staff', 'Food Packing Worker', 'Delivery Boy', 'Restaurant Supervisor']
  },
  {
    industryLabel: 'Housekeeping & Facility Management',
    industryValue: 'housekeeping_facility_management',
    businessTypeLabels: ['Facility Management Company', 'Cleaning / Housekeeping Agency', 'Labour Contractor', 'Service Provider'],
    labourCategoryLabels: ['Housekeeping Staff', 'Cleaner', 'Sweeper', 'Facility Supervisor', 'Pantry Boy', 'Office Boy', 'Toilet Cleaner', 'Floor Cleaner', 'Waste Collection Worker', 'Maintenance Helper', 'Gardener', 'Security Guard']
  },
  {
    industryLabel: 'Security Services',
    industryValue: 'security_services',
    businessTypeLabels: ['Security Agency', 'Facility Management Company', 'Service Provider'],
    labourCategoryLabels: ['Security Guard', 'Security Supervisor', 'Bouncer', 'Watchman', 'Gatekeeper', 'CCTV Operator', 'Patrol Guard', 'Fire Safety Guard', 'Reception Security', 'Night Guard']
  },
  {
    industryLabel: 'Food Processing',
    industryValue: 'food_processing',
    businessTypeLabels: ['Manufacturer', 'Factory / Industrial Unit', 'Labour Contractor', 'Food Processing Unit'],
    labourCategoryLabels: ['Food Processing Worker', 'Packing Worker', 'Machine Operator', 'Quality Checker', 'Kitchen Helper', 'Bakery Worker', 'Cold Storage Worker', 'Loader', 'Production Helper', 'Cleaning Staff', 'Supervisor', 'Dispatch Worker']
  },
  {
    industryLabel: 'Packaging Industry',
    industryValue: 'packaging_industry',
    businessTypeLabels: ['Manufacturer', 'Factory / Industrial Unit', 'Labour Contractor'],
    labourCategoryLabels: ['Packing Worker', 'Packaging Machine Operator', 'Labeling Worker', 'Sorting Worker', 'Quality Checker', 'Box Packing Helper', 'Loader', 'Dispatch Helper', 'Production Helper', 'Warehouse Helper', 'Supervisor']
  },
  {
    industryLabel: 'Agriculture & Farming',
    industryValue: 'agriculture_farming',
    businessTypeLabels: ['Agriculture / Farm Business', 'Labour Contractor', 'Service Provider'],
    labourCategoryLabels: ['Farm Worker', 'Field Labour', 'Tractor Driver', 'Harvester Operator', 'Irrigation Worker', 'Dairy Worker', 'Poultry Worker', 'Gardener', 'Nursery Worker', 'Crop Packing Worker', 'Farm Supervisor', 'Helper']
  },
  {
    industryLabel: 'Real Estate & Interior Work',
    industryValue: 'real_estate_interior_work',
    businessTypeLabels: ['Real Estate Developer', 'Interior Contractor', 'Construction Contractor', 'Labour Contractor'],
    labourCategoryLabels: ['Interior Carpenter', 'Painter', 'POP Worker', 'Electrician', 'Plumber', 'Tile Fitter', 'False Ceiling Worker', 'Furniture Installer', 'Site Helper', 'Civil Helper', 'Supervisor', 'Cleaner']
  },
  {
    industryLabel: 'Furniture & Woodwork',
    industryValue: 'furniture_woodwork',
    businessTypeLabels: ['Manufacturer', 'Interior Contractor', 'Workshop / Garage', 'Labour Contractor'],
    labourCategoryLabels: ['Carpenter', 'Furniture Maker', 'Polishing Worker', 'Wood Cutting Worker', 'CNC Wood Operator', 'Sofa Maker', 'Upholstery Worker', 'Helper', 'Installer', 'Painter', 'Supervisor', 'Packing Worker']
  },
  {
    industryLabel: 'Metal Fabrication',
    industryValue: 'metal_fabrication',
    businessTypeLabels: ['Manufacturer', 'Factory / Industrial Unit', 'Workshop / Garage', 'Labour Contractor'],
    labourCategoryLabels: ['Welder', 'Fitter', 'Fabricator', 'Gas Cutter', 'Grinder', 'CNC Operator', 'Lathe Machine Operator', 'Helper', 'Quality Checker', 'Site Installer', 'Workshop Supervisor']
  },
  {
    industryLabel: 'Plastic & Rubber Industry',
    industryValue: 'plastic_rubber_industry',
    businessTypeLabels: ['Manufacturer', 'Factory / Industrial Unit', 'Labour Contractor'],
    labourCategoryLabels: ['Plastic Machine Operator', 'Injection Moulding Operator', 'Rubber Processing Worker', 'Packing Worker', 'Quality Checker', 'Helper', 'Production Worker', 'Material Handler', 'Supervisor', 'Maintenance Helper']
  },
  {
    industryLabel: 'Automobile / Workshop',
    industryValue: 'automobile_workshop',
    businessTypeLabels: ['Workshop / Garage', 'Service Provider', 'Manufacturer', 'Labour Contractor'],
    labourCategoryLabels: ['Mechanic', 'Auto Electrician', 'Tyre Fitter', 'Washer', 'Painter', 'Denting Worker', 'Helper', 'Driver', 'Service Advisor', 'Spare Parts Assistant', 'Workshop Supervisor']
  },
  {
    industryLabel: 'Electrical & Electronics',
    industryValue: 'electrical_electronics',
    businessTypeLabels: ['Manufacturer', 'Service Provider', 'Factory / Industrial Unit', 'Labour Contractor'],
    labourCategoryLabels: ['Electrician', 'Electronics Technician', 'Wiring Worker', 'Assembly Worker', 'Soldering Worker', 'Repair Technician', 'Quality Checker', 'Helper', 'Installer', 'Maintenance Technician', 'Supervisor']
  },
  {
    industryLabel: 'Printing & Signage',
    industryValue: 'printing_signage',
    businessTypeLabels: ['Printing / Signage Company', 'Service Provider', 'Manufacturer', 'Labour Contractor'],
    labourCategoryLabels: ['Printer Labour', 'Printing Machine Operator', 'Graphic Print Assistant', 'Lamination Worker', 'Cutting Worker', 'Flex Installer', 'Signage Installer', 'Packing Worker', 'Helper', 'Supervisor']
  },
  {
    industryLabel: 'Healthcare & Hospital Services',
    industryValue: 'healthcare_hospital_services',
    businessTypeLabels: ['Healthcare Facility', 'Service Provider', 'Facility Management Company', 'Labour Contractor'],
    labourCategoryLabels: ['Ward Boy', 'Nursing Assistant', 'Hospital Cleaner', 'Housekeeping Staff', 'Patient Care Attendant', 'Ambulance Driver', 'Reception Assistant', 'Lab Helper', 'Security Guard', 'Pantry Staff', 'Maintenance Helper']
  },
  {
    industryLabel: 'Education / Institution Services',
    industryValue: 'education_institution_services',
    businessTypeLabels: ['Educational Institution', 'Facility Management Company', 'Service Provider'],
    labourCategoryLabels: ['Office Boy', 'Peon', 'Cleaner', 'Security Guard', 'Bus Driver', 'Helper', 'Lab Assistant', 'Pantry Staff', 'Housekeeping Staff', 'Maintenance Helper', 'Reception Assistant']
  },
  {
    industryLabel: 'E-commerce Operations',
    industryValue: 'ecommerce_operations',
    businessTypeLabels: ['E-commerce Seller', 'Warehouse / Logistics Operator', 'Distributor', 'Service Provider'],
    labourCategoryLabels: ['Picker', 'Packer', 'Delivery Boy', 'Warehouse Helper', 'Sorting Staff', 'Barcode Scanner Operator', 'Inventory Assistant', 'Return Processing Staff', 'Dispatch Worker', 'Data Entry Operator', 'Customer Support Assistant']
  },
  {
    industryLabel: 'Event Management / Tent House',
    industryValue: 'event_management_tent_house',
    businessTypeLabels: ['Event Management Company', 'Tent House / Decoration Contractor', 'Labour Contractor', 'Service Provider'],
    labourCategoryLabels: ['Event Helper', 'Tent House Worker', 'Decorator', 'Lightman', 'Sound Technician', 'Stage Worker', 'Catering Helper', 'Cleaner', 'Loader', 'Driver', 'Supervisor']
  },
  {
    industryLabel: 'Domestic / Household Services',
    industryValue: 'domestic_household_services',
    businessTypeLabels: ['Domestic Service Provider', 'Service Provider', 'Labour Contractor'],
    labourCategoryLabels: ['Maid', 'Cook', 'House Helper', 'Babysitter', 'Elder Care Assistant', 'Cleaner', 'Driver', 'Gardener', 'Security Guard', 'Home Nurse', 'Pet Care Helper']
  },
  {
    industryLabel: 'Beauty & Wellness',
    industryValue: 'beauty_wellness',
    businessTypeLabels: ['Beauty / Wellness Centre', 'Service Provider', 'Salon / Spa Business'],
    labourCategoryLabels: ['Beautician', 'Hair Dresser', 'Makeup Artist', 'Spa Therapist', 'Nail Technician', 'Salon Helper', 'Receptionist', 'Cleaner', 'Massage Therapist', 'Trainer']
  },
  {
    industryLabel: 'Cleaning & Sanitation',
    industryValue: 'cleaning_sanitation',
    businessTypeLabels: ['Cleaning / Housekeeping Agency', 'Facility Management Company', 'Service Provider', 'Labour Contractor'],
    labourCategoryLabels: ['Cleaner', 'Sweeper', 'Sanitation Worker', 'Drainage Cleaner', 'Waste Collection Worker', 'Toilet Cleaner', 'Floor Cleaner', 'Machine Cleaner', 'Supervisor', 'Helper']
  },
  {
    industryLabel: 'Repair & Maintenance',
    industryValue: 'repair_maintenance',
    businessTypeLabels: ['Service Provider', 'Facility Management Company', 'Workshop / Garage', 'Labour Contractor'],
    labourCategoryLabels: ['Maintenance Technician', 'Electrician', 'Plumber', 'AC Technician', 'Carpenter', 'Painter', 'Mechanic', 'Appliance Repair Technician', 'Helper', 'Supervisor', 'Welder']
  },
  {
    industryLabel: 'Mining / Quarry / Heavy Work',
    industryValue: 'mining_quarry_heavy_work',
    businessTypeLabels: ['Mining / Heavy Work Contractor', 'Labour Contractor', 'Factory / Industrial Unit', 'Transport Company'],
    labourCategoryLabels: ['Mining Labour', 'Quarry Worker', 'Heavy Loader Operator', 'JCB Operator', 'Crane Operator', 'Dumper Driver', 'Safety Worker', 'Site Helper', 'Stone Cutting Worker', 'Supervisor', 'Mechanic', 'Cleaner']
  }
]

const categorySeedLabels = Array.from(
  new Set(seededIndustryDependencyBlueprints.flatMap(item => item.labourCategoryLabels))
)

export const seededLabourCategoryCatalog: SeededCategoryCatalogItem[] = categorySeedLabels.map(label => {
  const slug = slugifySeedText(label) || 'category'
  return {
    id: toSeedCategoryId(label),
    label,
    slug,
    description: `${label} labour category for Labour Exchange company and admin dependency flows.`,
    demandLevel: 'medium'
  }
})

export const getSeededMasterCatalogForKey = (masterKey: string) => {
  if (masterKey === 'industry_category') return seededIndustryCategoryCatalog
  if (masterKey === 'business_type') return seededBusinessTypeCatalog
  return []
}

export const getSeededMasterAliases = (masterKey: string, canonicalValue: string) => {
  const catalog = getSeededMasterCatalogForKey(masterKey)
  const normalizedValue = canonicalValue.trim().toLowerCase()
  return catalog.find(item => item.value.trim().toLowerCase() === normalizedValue)?.aliases || []
}

