// 1. Define area and dates
var aoi = ee.Geometry.Point([95.0, 16.0]).buffer(20000).bounds();
var beforeDate = '2015-03-20';
var afterDate = '2015-09-04';

// 2. Load and filter Sentinel-1 data
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
.filterBounds(aoi)
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
.filter(ee.Filter.eq('instrumentMode', 'IW'));

// 3. Select images
var archive = s1.filterDate(beforeDate, '2015-03-21').first().select('VV');
var crisis = s1.filterDate(afterDate, '2015-09-05').first().select('VV');

// 4. Create RGB composite
var floodRGB = ee.Image.cat([archive, crisis, crisis]);
Map.centerObject(aoi, 11);
Map.addLayer(floodRGB, {min: -25, max: 0}, 'Flood RGB Composite');

// 5. Calculate Flood Map (Thresholding)
// Areas where backscatter decreases significantly are likely flooded
var threshold = -18; // Adjust this value based on your specific imagery
var difference = crisis.subtract(archive);
var floodExtent = difference.lt(threshold).selfMask();

Map.addLayer(floodExtent, {palette: ['red']}, 'Flooded Area');

// 6. Vectorize and Export
var vectors = floodExtent.reduceToVectors({
geometry: aoi,
crs: floodExtent.projection(),
scale: 30,
geometryType: 'polygon',
eightConnected: false,
labelProperty: 'zone'
});

Export.table.toDrive({
collection: vectors,
description: 'Flood_Extent_Shapefile',
fileFormat: 'SHP'
});
