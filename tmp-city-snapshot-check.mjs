import { getLabourMastersSnapshot } from "./lib/labour-masters.ts";
const snapshot = await getLabourMastersSnapshot();
const options = snapshot.options || [];
const activeStates = new Set((snapshot.activeStates || []).map(option => option.id));
const cityOptions = options.filter(option => option.masterKey === 'city');
const activeCities = cityOptions.filter(option => option.isActive !== false);
const linkedActiveCities = activeCities.filter(option => option.stateOptionId && activeStates.has(option.stateOptionId));
const activeUnlinkedCities = activeCities.filter(option => !option.stateOptionId || !activeStates.has(option.stateOptionId));
console.log(JSON.stringify({
  storage: snapshot.storage,
  counts: {
    states: options.filter(option => option.masterKey === 'state').length,
    activeStates: (snapshot.activeStates || []).length,
    cities: cityOptions.length,
    activeCities: activeCities.length,
    linkedActiveCities: linkedActiveCities.length,
    activeUnlinkedCities: activeUnlinkedCities.length
  },
  linkedActiveCityLabels: linkedActiveCities.map(option => option.label).slice(0, 50),
  activeUnlinkedCityLabels: activeUnlinkedCities.map(option => option.label).slice(0, 100)
}, null, 2));
