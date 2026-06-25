import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = value;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const { data, error } = await supabase.from('labour_admin_settings').select('settings_json').eq('id', 'labour-master-data').maybeSingle();
if (error) throw error;
const settings = data?.settings_json || {};
const options = Array.isArray(settings.options) ? settings.options : [];
const stateOptions = options.filter(option => option?.masterKey === 'state');
const cityOptions = options.filter(option => option?.masterKey === 'city');
const activeStates = stateOptions.filter(option => option?.isActive !== false);
const activeStateIds = new Set(activeStates.map(option => option.id).filter(Boolean));
const activeCities = cityOptions.filter(option => option?.isActive !== false);
const linkedActiveCities = activeCities.filter(option => option?.stateOptionId && activeStateIds.has(option.stateOptionId));
const unlinkedOrInactiveStateCities = activeCities.filter(option => !option?.stateOptionId || !activeStateIds.has(option.stateOptionId));
console.log(JSON.stringify({
  counts: {
    states: stateOptions.length,
    activeStates: activeStates.length,
    cities: cityOptions.length,
    activeCities: activeCities.length,
    linkedActiveCities: linkedActiveCities.length,
    activeUnlinkedOrInactiveStateCities: unlinkedOrInactiveStateCities.length,
  },
  linkedActiveCities: linkedActiveCities.map(option => ({ label: option.label, stateOptionId: option.stateOptionId })).slice(0, 100),
  activeUnlinkedOrInactiveStateCities: unlinkedOrInactiveStateCities.map(option => ({ label: option.label, stateOptionId: option.stateOptionId || null })).slice(0, 200)
}, null, 2));
