-- =============================================================================
-- Register Open-Meteo and NASA SRTM 30 m DEM in public.data_sources.
-- =============================================================================

insert into public.data_sources (
  source_key,
  name,
  source_url,
  licence,
  attribution,
  spatial_resolution_m,
  temporal_resolution,
  is_modelled
)
values
  (
    'open_meteo',
    'Open-Meteo High-Resolution Weather and Soil Moisture Forecast',
    'https://open-meteo.com/en/docs',
    'CC BY 4.0 (non-commercial open access)',
    'Weather and soil moisture forecast data provided by Open-Meteo (https://open-meteo.com/) under CC BY 4.0.',
    9000,
    'daily',
    true
  ),
  (
    'srtm_gl1',
    'NASA SRTM Version 3.0 Global 1 arc-second Digital Elevation Model (SRTMGL1_NC.003)',
    'https://www.earthdata.nasa.gov/data/catalog/lpcloud-srtmgl1-003',
    'Public domain (NASA ESDIS open data policy)',
    'NASA JPL (2013). NASA Shuttle Radar Topography Mission Global 1 arc second V003. NASA EOSDIS Land Processes DAAC. https://doi.org/10.5067/MEaSUREs/SRTM/SRTMGL1.003',
    30,
    'static',
    false
  )
on conflict (source_key) do update set
  name = excluded.name,
  source_url = excluded.source_url,
  licence = excluded.licence,
  attribution = excluded.attribution,
  spatial_resolution_m = excluded.spatial_resolution_m,
  temporal_resolution = excluded.temporal_resolution,
  is_modelled = excluded.is_modelled;
