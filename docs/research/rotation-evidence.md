# Rotation Evidence

**Sources checked:** 2026-11-14.
**Scope:** rain-fed systems relevant to Tofa, with transfer limits stated explicitly.

## Evidence by system

### Sequential maize-legume rotation, Samaru

Yusuf et al. (2009) conducted field trials in Samaru, Northern Guinea Savanna, between 2003 and 2005. Maize followed cowpea (IT 96D-724, SAMPEA-7), soybean (TGx 1448-2E, SAMSOY-2), maize, or fallow. Mean maize yield after legumes was 1.2 times yield after fallow and 1.3 times yield after maize. The study separated fixed-nitrogen effects from other rotation effects and found both varied with legume nitrogen balance. The methods and location do not establish an equivalent yield increase or fertilizer replacement in Tofa. [Paper DOI](https://doi.org/10.1007/s10705-008-9232-9).

An IAR/ABU Samaru long-term experiment includes maize-maize, maize-cowpea and maize-soybean rotation treatments, tillage treatments and nitrogen rates. It is a relevant Nigerian research lead, but full thesis metadata and the result tables must be extracted before quantitative use. [Thesis source](https://kubanni-backend.abu.edu.ng/server/api/core/bitstreams/d9815ca7-448d-455d-a90b-134a171242be/content).

### Millet-cowpea systems, Sadoré, Niger

Bado et al. (2022) report a 25-year experiment at ICRISAT's Sahelian Center in Niger. Treatments distinguish sole millet, millet/cowpea intercrop, millet-cowpea sequence/rotation, and combinations. Fertilizer and millet crop-residue treatments were included. The authors report improved productivity for several integrated systems and persistent soil organic carbon decline relative to natural vegetation fallow. This is valuable Sahel evidence about long-term nutrient and residue management, but it does not establish a Tofa response. Intercrop findings must not be represented as sequential rotation evidence. [ICRISAT repository record](https://oar.icrisat.org/11988/); [published paper](https://www.sciencedirect.com/science/article/pii/S0167880922001414).

Yamoah et al. (2003) describe a Sadoré, Niger study of manure, fertilizer and crop residues in millet-based systems. Their summary reports rotation performance relative to sole crop and intercrop treatments. It reinforces that crop sequence and organic/mineral nutrient management interact, but numerical results require review of full treatment details. [ICRISAT Sahelian Center paper](https://oar.icrisat.org/6816/1/Tropicultura_21_2_66-72_2003.pdf).

### Sequential versus within-season systems

| System | Meaning | Evidence and restriction |
| --- | --- | --- |
| Sequential rotation | Different crop occupies a parcel in successive seasons/years | Samaru maize-after-legume trials and Niger millet-cowpea rotation treatments are direct sequence evidence. |
| Intercropping | Crops grow together during overlapping periods | Interviews and Niger trials report cereal-legume intercrops. This does not establish sequence effects. |
| Relay cropping | A second crop is sown before the first crop is harvested | Reported in Sudan Savanna field surveys and separate ICRISAT trials. This creates different water and labor competition. |
| Strip cropping | Crops occupy adjacent strips, potentially simultaneously | Interview 01 describes strip practice; it is not proof of a rotation benefit. |

### Repeated cultivation and soil/pest implications

The Sudan Savanna Kano-Katsina-Maradi field survey documents continuous cultivation and reports associations among cultivation history, Striga/Alectra, soil fertility and yields. Because this is observational survey evidence, it does not prove that a specific rotation causally breaks pests or diseases. It also distinguishes cereal-legume relay intercropping from crop sequence. Source copy and complete publication details need verification. [Report copy](https://www.researchgate.net/publication/264206241_Biophysical_Characterisation_of_Crop_Fields_in_Sudan_Savannah_Zone_of_North_Western_Nigeria_Kano-Katsina-Maradi_Pilot_Learning_Site_Sudan_Savanna_Agro-Ecological_Zone_Innovation_Platform).

No verified evidence in this pass supports a generic “legume breaks disease” rule, a fixed rotation interval, or a universal benefit from avoiding repeated cultivation. Pest species, host range, crop varieties and residue handling need local evidence.

## Tofa farmer reports

The interview case studies report differing local practices:

- Interview 01: strip cropping/intercropping; no established sequential rotation reported.
- Interview 02: seasonal crop changes including sorghum, millet, maize, soybean and groundnut; farmer reports a sequence learned through training.
- Interview 03: farmer describes a 2–3 year cycle involving sorghum, soybean, cowpea and maize, and separately describes sorghum-legume intercropping.

These are first-hand reports of practice, not measured comparisons. Preserve each report with interview provenance. Do not collapse them into one Tofa rotation recommendation. See docs/research/field-interviews/.

## Implementation implications

1. Keep rotation rules labelled by evidence type: literature or farmer report, as required by ADR-0011.
2. Identify whether a sequence is sequential, intercrop, relay or strip before comparison.
3. A legume preceding a cereal is a supported comparison candidate, not a guaranteed outcome.
4. Do not infer a nitrogen credit, fertilizer reduction, pest break, or residue benefit without crop-, variety-, method- and location-relevant support.
5. Seasonal feasibility depends on actual sowing/harvest timing, remaining moisture, variety duration, labor, seed and inputs. The reviewed evidence does not provide validated Tofa thresholds for these.
6. CDA or an agronomist should review any rotation rule before it can affect farmer-facing recommendations.
