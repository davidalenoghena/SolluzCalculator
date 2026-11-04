# Configuration guide

Solluz Synergy has no database. Everything the website shows – appliances, equipment, prices, calculator assumptions, company details and page content – comes from **one JSON configuration**.

## Where the configuration lives

| Layer | Location | Who sees it |
|---|---|---|
| **Published default** | `src/config/defaultConfig.json` (bundled into the build) | Every visitor |
| **Browser override** | LocalStorage key `solluz_synergy_config` | Only the browser where it was saved |

On start-up the app:

1. loads the bundled default;
2. looks for a saved configuration in LocalStorage;
3. uses it if it passes validation;
4. otherwise uses the default;
5. if saved data exists but is invalid, the admin panel shows a warning with options to **restore defaults**, **import a valid file**, or **download the invalid data** for recovery. Invalid data is never deleted automatically.

## Editing in the admin panel

1. Go to `/admin` and enter the PIN.
2. Make changes. They are held in a draft – the header shows *Unsaved changes*.
3. Click **Save changes**. The draft is validated; if valid it is written to LocalStorage and the calculator in this browser uses it immediately. If invalid, nothing is saved and the problems are listed.
4. **Discard** reverts the draft to the last saved version.

## Export

**Admin → Configuration → Export Configuration** downloads `solluz-synergy-config.json` containing the saved/active configuration: appliances, appliance categories, equipment catalogue and prices, pricing rules (markup, installation, delivery, additional charges, optional services, discounts, tax), calculator settings, company details and website content. It adds `meta.exportedAt`.

It never contains the admin PIN or any secret (they are not part of the configuration).

## Import

**Admin → Configuration → Import Configuration** accepts a `.json` file (max 2 MB). Before anything changes the app:

1. parses the JSON;
2. checks `meta.version` against the schema version this build supports (currently **1**) – newer or older versions are rejected with an explanation;
3. validates every required field, number range and category, and checks that IDs are present, well-formed and unique;
4. shows a preview comparing the file with the current configuration (counts, company email, key settings, number of price changes, warnings);
5. asks for confirmation;
6. saves it to LocalStorage.

If any step fails, an error is shown and the current configuration is left untouched.

## Restore defaults

**Restore Default Configuration** (after confirmation) deletes the browser's saved copy, returning to the published default. Export first if you want a backup.

## Publishing changes for all visitors

Saving or importing only affects **that browser**. To make new prices or equipment the default for everyone:

1. Save and test the changes in the admin panel.
2. **Export Configuration**.
3. Replace `src/config/defaultConfig.json` with the exported file (the `exportedAt` field may stay or be removed). Optionally set `meta.revision` to today's date so admins can tell versions apart.
4. Run:
   ```bash
   npm test        # includes a check that the default configuration is valid
   npm run build
   ```
5. Commit and redeploy (Vercel/Netlify/Cloudflare rebuild automatically on push).

After deployment, new visitors get the new defaults. Any browser with its own saved copy (e.g. the admin's) keeps using that copy until **Restore Default Configuration** is clicked or a new file is imported. The admin dashboard shows when a browser's saved revision differs from the published one.

## Schema reference (summary)

```jsonc
{
  "meta": { "version": 1, "revision": "2026-11-04", "label": "…" },
  "currency": "NGN",
  "company": { "name", "tagline", "email", "phone", "whatsapp", "address", "businessHours",
               "social": { "facebook", "instagram", "x", "linkedin" } },
  "content": { "hero", "intro", "about", "whyChooseUs", "services", "projects", "testimonials" },
  "applianceCategories": ["Lighting", …],
  "appliances": [{ "id", "name", "category", "defaultWattage", "defaultHours", "surgeFactor", "isActive" }],
  "products": [{
    "id", "category", "name", "brand", "model", "unitPrice", "isActive", "description",
    "specifications": [{ "label", "value" }],
    // solar-panel:       "capacity" (W)
    // inverter:          "capacity" (VA), "supportedSystemTypes", "systemVoltage", "surgeRatio",
    //                    "hasBuiltInMppt", "maxPvInputW", "parallelCapable"
    // battery:           "capacity" (Wh), "chemistry" (lithium|lead-acid|gel), "systemVoltage"
    // charge-controller: "capacity" (A), "supportedVoltages"
    // mounting|cabling|protection|accessory:
    //                    "quantityBasis" (fixed|per-panel|per-battery|per-inverter|per-kwp),
    //                    "quantityPerBasis", "isOptional", "defaultSelected"
  }],
  "pricing": { "markupPercent", "installation", "delivery", "additionalCharges",
               "optionalServices", "discounts", "tax" },
  "calculator": { "inverterEfficiency", "batteryEfficiency", "depthOfDischarge", "peakSunHours",
                  "systemDeratingFactor", "inverterSafetyMargin", "powerFactor",
                  "defaultInverterSurgeRatio", "diversityFactor", "solarCoverage",
                  "chargeControllerSafetyFactor", "defaultSystemVoltage", "defaultBackupHours",
                  "maxBackupHours", "recommendedSystemType", "maxParallelInverters",
                  "preferredBatteryChemistry" }
}
```

Fractions (efficiencies, DoD, derating, margins) are stored as 0–1 values; the admin panel shows them as percentages. Prices are whole Naira.

### Changing the schema (developers)

If you change the structure incompatibly, bump `CONFIG_SCHEMA_VERSION` in `src/config/index.ts` and `meta.version` in the default file, and update `src/storage/configValidation.ts`. Older exported files will then be rejected on import with a clear message.

## Images

Project images can be full URLs or paths to files in `public/` (e.g. put `site-1.jpg` in `public/images/projects/` and reference `/images/projects/site-1.jpg`). Paths are resolved against the deployment base automatically. Adding new image files requires a redeploy.
