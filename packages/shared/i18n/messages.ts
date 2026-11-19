/**
 * First batch of interface messages for DalaShift Phase 5 (section 9 of the
 * redesign brief). English is the default; Hausa is the only other language.
 *
 * Every message is keyed so engine-generated copy and interface chrome share
 * one dictionary. `t(id, vars)` substitutes `{name}` style placeholders and
 * humanises any id that is missing, so no raw id ever reaches the interface.
 *
 * Messages are written for a low-literacy farmer on a phone: plain words
 * before technical words, short sentences and no em dashes. Hausa phrasing
 * follows the field terms already used in `format.ts` (kasa, gona, shuka).
 */

export type MessageId = string;

export const messages: Readonly<Record<string, Readonly<{ en: string; ha: string }>>> = {
  // Global navigation
  'nav.overview': { en: 'Overview', ha: 'Dubawa' },
  'nav.myFields': { en: 'My fields', ha: 'Filayena' },
  'nav.methodology': { en: 'Methodology', ha: 'Hanyar Aiki' },
  'nav.signIn': { en: 'Sign in', ha: 'Shiga' },
  'nav.addFarm': { en: 'Add a farm', ha: 'Kara Gona' },
  'nav.reports': { en: 'Reports', ha: 'Rahotanni' },
  'nav.settings': { en: 'Settings', ha: 'Saituna' },
  'nav.signOut': { en: 'Sign out', ha: 'Fita' },
  'nav.skipToMain': { en: 'Skip to main content', ha: 'Tsallaka zuwa babban abu' },

  // Footer
  'footer.tagline': {
    en: 'Guidance for your own field, based on satellite data and local knowledge.',
    ha: 'Shawarwari don gonarka, bisa bayanan tauraron dan adam da ilimin gida.',
  },
  'footer.nasaNotice': {
    en: 'DalaShift uses public NASA data. It is not endorsed by or affiliated with NASA.',
    ha: "DalaShift yana amfani da bayanan NASA na jama'a. NASA ba ta tallafawa ko hada kai da DalaShift ba.",
  },

  // Landing
  'landing.heroTitle': {
    en: 'Know when your field is ready.',
    ha: 'San lokacin da gonarka ta shirya.',
  },
  'landing.heroSubtitle': {
    en: 'Get clear advice on when to plant and what to grow, based on satellite data and local knowledge.',
    ha: 'Samu shawara a sarari kan lokacin shuka da abin da za a shuka, bisa bayanan tauraron dan adam da ilimin gida.',
  },
  'landing.primaryAction': { en: 'Register your farm', ha: 'Yi rajistar gonarka' },
  'landing.secondaryAction': { en: 'See how it works', ha: 'Duba yadda take aiki' },
  'landing.howItWorksTitle': { en: 'How it works', ha: 'Yadda take aiki' },
  'landing.howStep1': { en: '1. Add your farm', ha: '1. Kara gonarka' },
  'landing.howStep2': { en: '2. Add a field', ha: '2. Ara fili' },
  'landing.howStep3': { en: '3. Get advice', ha: '3. Samu shawara' },

  // Authentication
  'auth.signInTitle': { en: 'Sign in', ha: 'Shiga' },
  'auth.createAccountTitle': { en: 'Create account', ha: 'Kira asusu' },
  'auth.fullName': { en: 'Full name', ha: 'Cikakken suna' },
  'auth.emailOrPhone': { en: 'Email or phone', ha: 'Imel ko lambar waya' },
  'auth.password': { en: 'Password', ha: 'Kalmar sirri' },
  'auth.consent': {
    en: 'I agree to the use of my data to provide this service.',
    ha: 'Na yarda da amfani da bayanana don samar da wannan sabis.',
  },
  'auth.switchToSignUp': { en: 'Need an account? Create one', ha: 'Babu asusu? Kirkiro daya' },
  'auth.switchToSignIn': { en: 'Already have an account? Sign in', ha: 'Kana da asusu? Shiga' },
  'auth.signInAction': { en: 'Sign in', ha: 'Shiga' },
  'auth.createAccountAction': { en: 'Create account', ha: 'Kira asusu' },

  // Dashboard
  'dashboard.title': { en: 'My dashboard', ha: 'Allon bayanai na' },
  'dashboard.noFarms': { en: 'You have not added a farm yet.', ha: 'Ba ka ara gona ba tukuna.' },
  'dashboard.retry': { en: 'Try again', ha: 'Sake gwadawa' },
  'dashboard.fields': { en: 'Fields', ha: 'Filaye' },
  'dashboard.area': { en: 'Area', ha: 'Girman fili' },
  'dashboard.plantingTrigger': { en: 'When to plant', ha: 'Lokacin shuka' },
  'dashboard.notAvailable': { en: 'Not available', ha: 'Ba a samu ba' },

  // Farms list
  'farms.title': { en: 'My farms', ha: 'Gonakina' },
  'farms.hint': { en: 'Select a farm to see its fields.', ha: 'Zabi gona don ganin filayenta.' },
  'farms.addFarm': { en: 'Add a farm', ha: 'Kara Gona' },
  'farms.openWorkspace': { en: 'Open farm workspace', ha: 'Bude wurin aikin gona' },
  'farms.selectField': { en: 'Select a field', ha: 'Zabi fili' },

  // Registration and add-field wizard
  'wizard.stepFarm': { en: 'Your farm', ha: 'Gonarka' },
  'wizard.stepField': { en: 'Your field', ha: 'Filinka' },
  'wizard.stepReview': { en: 'Review', ha: 'Dubawa' },
  'wizard.firstRunHint': {
    en: 'Just three short steps. You can change these later.',
    ha: 'Matakai uku ne kawai. Za ka iya canza su daga baya.',
  },
  'wizard.fieldNameLabel': { en: 'Field name', ha: 'Sunan fili' },
  'wizard.farmNameLabel': { en: 'Farm name', ha: 'Sunan gona' },
  'wizard.waterSourceLabel': { en: 'Water source', ha: 'Tushen ruwa' },
  'wizard.notesLabel': { en: 'Notes about your soil', ha: 'Bayani game da kasan' },
  'wizard.next': { en: 'Next', ha: 'Na gaba' },
  'wizard.back': { en: 'Back', ha: 'Koma baya' },
  'wizard.save': { en: 'Save', ha: 'Ajiye' },
  'wizard.review': { en: 'Review', ha: 'Dubawa' },
  'wizard.retry': { en: 'Try again', ha: 'Sake gwadawa' },

  // Reports
  'reports.title': { en: 'My reports', ha: 'Rahotannina' },
  'reports.noReports': { en: 'No reports yet.', ha: 'Babu rahotanni tukuna.' },
  'reports.generate': { en: 'Generate report', ha: 'Samar da rahoto' },
  'reports.print': { en: 'Print', ha: 'Bugawa' },
  'reports.openPdf': { en: 'Open PDF', ha: 'Bude PDF' },
  'reports.noPdf': { en: 'No PDF is available yet.', ha: 'Babu PDF da ake da shi tukuna.' },

  // Farm workspace section tabs and actions
  'workspace.fields': { en: 'Fields', ha: 'Filaye' },
  'workspace.crops': { en: 'Crops', ha: 'Amfanin gona' },
  'workspace.priorities': { en: 'Priorities', ha: 'Abubuwan fifiko' },
  'workspace.advice': { en: 'Advice', ha: 'Shawara' },
  'workspace.workingOn': { en: 'Working on', ha: 'Ana aiki a kan' },
  'workspace.edit': { en: 'Edit', ha: 'Gyara' },
  'workspace.save': { en: 'Save', ha: 'Ajiye' },
  'workspace.cancel': { en: 'Cancel', ha: 'Soke' },
  'workspace.delete': { en: 'Delete', ha: 'Share' },
  'workspace.addField': { en: 'Add a field', ha: 'Ara fili' },
  'workspace.runAssessment': { en: 'Run assessment', ha: 'Gudanar da kimantawa' },
  'workspace.editFarm': { en: 'Edit farm', ha: 'Gyara gona' },
  'workspace.deleteFarm': { en: 'Delete farm', ha: 'Share gona' },

  // Data states
  'state.loading': { en: 'Loading', ha: 'Ana loda bayanai' },
  'state.emptyFields': { en: 'You have not added a field yet.', ha: 'Ba ka ara fili ba tukuna.' },
  'state.emptyCrops': {
    en: 'No crops recorded on this field yet.',
    ha: 'Babu amfanin gona da aka rubuta a wannan filin tukuna.',
  },
  'state.error': { en: 'We could not load this.', ha: 'Ba mu iya loda wannan ba.' },
  'state.stale': {
    en: 'This information is out of date. Refresh when connected.',
    ha: 'Wannan bayanin ya tsufa. Sabunta lokacin da aka haɗa.',
  },
  'state.offline': {
    en: 'You are offline. Showing the last saved information.',
    ha: 'Ba a da haɗin yanar gizo. Ana nuna bayanan da aka ajiye na ƙarshe.',
  },
  'state.partial': { en: 'Some information is missing.', ha: 'Wasu bayanan sun ɓace.' },
  'state.retry': { en: 'Try again', ha: 'Sake gwadawa' },
  'state.refresh': { en: 'Refresh', ha: 'Sabunta' },

  // Map toolbar and drawing
  'map.selectField': { en: 'Select field', ha: 'Zabi fili' },
  'map.draw': { en: 'Draw', ha: 'Zana' },
  'map.myLocation': { en: 'My location', ha: 'Wurin da nake' },
  'map.layers': { en: 'Layers', ha: 'Yadudduka' },
  'map.done': { en: 'Done', ha: 'An gama' },
  'map.undo': { en: 'Undo', ha: 'Koma baya' },
  'map.clear': { en: 'Clear', ha: 'Share' },
  'map.cancel': { en: 'Cancel', ha: 'Soke' },
  'map.tapCorner': {
    en: 'Tap every corner. When you reach the first corner, tap Done.',
    ha: 'Matsa kowane kusurwa. Lokacin da ka isa kusurwar farko, matsa An gama.',
  },
  'map.tapToPlace': {
    en: 'Tap the map to place the point.',
    ha: 'Matsa taswirar don sanya alamar wuri.',
  },
  'map.areaChip': { en: 'About {area} hectares', ha: 'Kimanin hekta {area}' },

  // Verdict and evidence labels
  'verdict.suitable': { en: 'Suitable', ha: 'Ya dace' },
  'verdict.conditional': { en: 'Conditional', ha: 'Da sharadi' },
  'verdict.notSuitable': { en: 'Not suitable', ha: 'Bai dace ba' },
  'verdict.notEnoughInformation': { en: 'Not enough information', ha: 'Babu isasshen bayani' },
  'verdict.pass': { en: 'Pass', ha: 'Ya wuce' },
  'verdict.fail': { en: 'Fail', ha: 'Bai wuce ba' },
  'verdict.uncertain': { en: 'Uncertain', ha: 'Babu tabbas' },
  'verdict.notAssessed': { en: 'Not assessed', ha: 'Ba a tantance ba' },
  'verdict.strongEvidence': { en: 'Strong evidence', ha: 'Hujja mai ƙarfi' },
  'verdict.moderateEvidence': { en: 'Moderate evidence', ha: 'Hujja matsakaiciya' },
  'verdict.weakEvidence': { en: 'Weak evidence', ha: 'Hujja mai rauni' },

  // Engine-generated planting trigger copy (keyed from format.ts titles)
  'engine.trigger.waitForConfirmedMoisture': {
    en: 'Wait for confirmed soil moisture across several showers',
    ha: 'Jira har kasa ta rike danshi sosai kafin shuka',
  },
  'engine.trigger.plantOnFirstRains': {
    en: 'Plant immediately on the first sustained rains',
    ha: 'Shuka nan take da zarar ruwan sama na farko ya sauka',
  },
  'engine.trigger.prepareAndPlantQuickly': {
    en: 'Prepare the land and sow quickly once early moisture establishes',
    ha: 'Gyara gona da shuka da wuri bayan ruwan farko ya jiqa kasa',
  },

  // ==== map-canvas ====
  'map.gridSmap': { en: 'SMAP Soil Moisture (9 km cell)', ha: 'Danshin kasa na SMAP (9 km)' },
  'map.gridChirps': { en: 'CHIRPS Rainfall (5.5 km cell)', ha: 'Ruwan sama na CHIRPS (5.5 km)' },
  'map.gridSoilGrids': { en: 'ISRIC SoilGrids (250 m cell)', ha: 'Kasan na SoilGrids (250 m)' },
  'map.gridLandsat': {
    en: 'Landsat Reflectance (30 m pixel)',
    ha: 'Haske mai dawowa na Landsat (30 m)',
  },
  'map.gridPower': { en: 'NASA POWER Climate (~55 km cell)', ha: 'Yanayin NASA POWER (~55 km)' },
  'map.previewUnavailable': { en: 'Map preview unavailable', ha: 'Babu dubin taswira' },
  'map.previewUnavailableBody': {
    en: 'Your browser could not start the interactive map. Enter parcel coordinates using the fields below instead. No location has been captured automatically.',
    ha: 'Ba browser din ka iya buɗe taswirar ba. Shiga lambobin wurin fili a cikin kudududan da ke ƙasa. Ba mu ɗauki wuri ba ta hanyar kai.',
  },
  'map.loadingImagery': {
    en: 'Loading satellite land imagery...',
    ha: 'Ana loda hotunan ƙasa daga tauraron dan adam...',
  },
  'map.imageryUnavailable': {
    en: 'Map imagery is unavailable. Your field boundary is still shown.',
    ha: 'Ba a sami hotunan taswira ba. Ana nuna iyakar filinka yana nan.',
  },
  'map.fieldMap': { en: 'Field map', ha: 'Taswirar fili' },
  'map.unnamedField': { en: 'Field', ha: 'Fili' },
  'map.layersTitle': { en: 'Map layers', ha: 'Yaduddukkan taswira' },
  'map.zoomIn': { en: 'Zoom in', ha: 'Karin gani' },
  'map.zoomOut': { en: 'Zoom out', ha: 'Ragewar gani' },
  'map.drawField': { en: 'Draw field', ha: 'Zana fili' },
  'map.drawBoundary': { en: 'Draw a field boundary', ha: 'Zana iyakar fili' },
  'map.tapEachCorner': {
    en: 'Tap each corner, then press Done.',
    ha: 'Matsa kowane kusurwa, sannan matsa An gama.',
  },
  'map.tapToPlaceField': {
    en: 'Tap the map or use your location to place your field.',
    ha: 'Matsa taswira ko amfani da wurinka don sanya filinka.',
  },
  'map.useGps': { en: 'Use GPS', ha: 'Amfani da GPS' },
  'map.cancelAria': { en: 'Cancel drawing or capture', ha: 'Soke zana ko ɗaukar wuri' },
  'map.locationUnsupported': {
    en: 'This device cannot provide a location. Tap the map or enter coordinates manually.',
    ha: "Wannan na'urar ba ta iya ba da wuri. Matsa taswira ko shiga lambobin wurin da hannu.",
  },
  'map.locationDenied': {
    en: 'Location access was denied or unavailable. Tap the map or enter coordinates manually. No location has been captured.',
    ha: 'Ba a yarda da samun wuri ko ba a sami shi ba. Matsa taswira ko shiga lambobin wurin da hannu. Ba mu ɗauki wuri ba.',
  },
  'map.areaPerimeter': {
    en: 'Area {area} ha · Perimeter {perimeter} m',
    ha: 'Girman fili {area} ha · Kewayen fili {perimeter} m',
  },
  'map.areaOnly': { en: 'Area {area} ha', ha: 'Girman fili {area} ha' },
  'map.tapCornersMeasure': {
    en: 'Tap corners to measure',
    ha: 'Matsa kusurwodi don auna girman fili',
  },
  'map.whichField': { en: 'Which field?', ha: 'Wane fili?' },
  'map.closeLayers': { en: 'Close layers', ha: 'Rufe yadudduka' },
  'map.dataLayer': {
    en: 'Satellite data layer',
    ha: 'Tabo na bayanan tauraron dan adam',
  },
  'map.dataLayerAria': {
    en: 'Satellite data layer resolution overlay',
    ha: 'Tabon bayanan tauraron dan adam',
  },
  'map.showFootprint': { en: 'Show cell footprint', ha: 'Nuna alamar sel' },
  'map.hideDetails': { en: 'Hide map details', ha: 'Boye bayanan taswira' },
  'map.basemap': { en: 'Basemap', ha: 'Taswirar tushe' },
  'map.satellite': { en: 'Satellite', ha: 'Tauraron dan adam' },
  'map.streets': { en: 'Streets', ha: 'Tituna' },
  'map.search': { en: 'Find a place', ha: 'Nemi wuri' },
  'map.searchAria': { en: 'Search places in Kano', ha: 'Nemi wurare a Kano' },
  'map.searchPlaceholder': {
    en: 'Search Kano towns and LGAs',
    ha: 'Nemi garuruwa da kananan hukumomi a Kano',
  },
  'map.searchNoResults': {
    en: 'No place found. Try a shorter name.',
    ha: 'Ba a sami wuri ba. Gwada suna mafi guntu.',
  },
  'map.searchHint': {
    en: 'Search covers Kano State only.',
    ha: 'Nema yana cikin jihar Kano kawai.',
  },

  // ==== wizard ====
  'wizard.errFarmName': {
    en: 'Give your farm a name before you continue.',
    ha: 'Sanya gonarka suna kafin ka ci gaba.',
  },
  'wizard.errWaterSupply': {
    en: 'Choose how your farm gets water, or pick Not sure.',
    ha: 'Zabi yadda gona ta samu ruwa, ko zaɓi Ba ni tabbata.',
  },
  'wizard.errCropSearch': {
    en: 'Pick the specific bean crop you mean from the choices above.',
    ha: 'Zabi irin wake da kake nufe daga zaɓuɓɓukan da ke sama.',
  },
  'wizard.errCurrentCrop': {
    en: 'Choose the crop you grow on this farm right now.',
    ha: 'Zabi amfanin gona da kake shuka a wannan gona yanzu.',
  },
  'wizard.errPlannedCrop': {
    en: 'Choose the crop you plan to plant next.',
    ha: 'Zabi amfanin gona da kake shirya shuka na gaba.',
  },
  'wizard.errEnterFarmName': {
    en: 'Enter a farm name before saving.',
    ha: 'Shiga sunan gona kafin ajiye.',
  },
  'wizard.errBeans': {
    en: 'Choose a specific crop instead of the unresolved name “beans”.',
    ha: 'Zabi amfanin gona na musamman maimakon sunan “wake” ba a warware ba.',
  },
  'wizard.errChooseCropsExisting': {
    en: "Choose the crop you grow now and the one you plan next, or change to 'I am planning what to grow'.",
    ha: "Zabi amfanin gona da kake shuka yanzu da na gaba, ko canza zuwa 'Ina shirya abin da zan shuka'.",
  },
  'wizard.errChooseCropNext': {
    en: 'Choose the crop you plan to grow before saving.',
    ha: 'Zabi amfanin gona da kake shirya shuka kafin ajiye.',
  },
  'wizard.errFieldDetails': {
    en: 'Give each field a name and mark it on the map. Pinned fields also need an accuracy value between 1 and 5,000 metres.',
    ha: 'Sanya kowane fili suna kuma nuna shi a taswira. Filayen da aka ɗora suna buƙatar daidaito tsakanin 1 da 5,000 mita.',
  },
  'wizard.stageFarm': { en: 'the farm', ha: 'gonar' },
  'wizard.stageCatalog': { en: 'the crop catalog', ha: 'jerin amfanin gona' },
  'wizard.stageFields': { en: 'your fields', ha: 'filayenka' },
  'wizard.stageCrops': { en: 'your crops', ha: 'amfanin gonarka' },
  'wizard.stagePriorities': {
    en: 'your planting preferences',
    ha: 'abin da kake so game da shuka',
  },
  'wizard.stageGuidance': { en: 'your farm guidance', ha: 'shawarwar gonarka' },
  'wizard.savePartial': {
    en: '{message} Your farm was saved, but {stage} did not save. Nothing you typed was lost. Use Retry to save the rest.',
    ha: '{message} An ajiye gonarka, amma {stage} ba ya ajiye. Ba wani abin da ka rubuta ya ɓace. Yi amfani da Sake gwadawa don ajiye sauran.',
  },
  'wizard.saveFirstFail': {
    en: '{message} {stage} did not save. Nothing you typed was lost. Use Retry to try again.',
    ha: '{message} {stage} ba ya ajiye. Ba wani abin da ka rubuta ya ɓace. Yi amfani da Sake gwadawa.',
  },
  'wizard.saveGenericError': {
    en: 'Unable to save the farm. Please try again.',
    ha: 'Ba mu iya ajiye gona ba. Sake gwadawa.',
  },
  'wizard.cropNotInCatalog': {
    en: 'The crop catalog does not contain {code}.',
    ha: 'Jerin amfanin gona ba ya ɗaukar {code}.',
  },
  'wizard.incompleteFarmData': {
    en: 'The server returned incomplete farm data.',
    ha: 'Bayanan gonar da sabawa ta ba mu ba cikakke ba.',
  },
  'wizard.invalidGeometry': {
    en: 'Parcel location or geometry is invalid.',
    ha: 'Wurin fili ko siffar ba ta daidai ba.',
  },
  'wizard.unnamedField': { en: 'Unnamed field', ha: 'Fili marar suna' },
  'wizard.notSureYet': { en: 'Not sure yet', ha: 'Ban tabbata tukuna' },
  'wizard.signinToSave': { en: 'Sign in to save', ha: 'Shiga don ajiye' },
  'wizard.openSavedFarm': { en: 'Open your saved farm.', ha: 'Bude gonarka da aka ajiye.' },
  'wizard.retrySaving': { en: 'Retry saving', ha: 'Sake gwadawa ajiye' },
  'wizard.title': { en: 'Add your farm', ha: 'Kara gonarka' },
  'wizard.subtitle': {
    en: 'First tell us about your farm. Next add your crops. Then mark your fields on the map.',
    ha: 'Da farko gayo mana game da gonarka. Sannan amfani gona. Saka filayenka a taswira.',
  },
  'wizard.stepOf': { en: 'Step {current} of 3', ha: 'Mataki {current} na 3' },
  'wizard.step1Label': { en: '1. Your farm', ha: '1. Gonarka' },
  'wizard.step2Label': { en: '2. Your crops', ha: '2. Amfanin gona' },
  'wizard.step3Label': { en: '3. Your fields', ha: '3. Filayenka' },
  'wizard.farmShort': { en: 'Farm', ha: 'Gona' },
  'wizard.step1Hint': {
    en: 'Name your farm, add your crops, then mark your fields on the map.',
    ha: 'Sanya gonarka suna, amfani gona, sannan nuna filayenka a taswira.',
  },
  'wizard.whoDescribesYou': { en: 'Which describes you?', ha: 'Wanne ya fi kaya ka?' },
  'wizard.modeExisting': { en: 'I already farm this land', ha: 'Na riga ina girki a wannan ƙasa' },
  'wizard.modeProspective': {
    en: 'I am planning what to grow',
    ha: 'Ina shirya abin da zan shuka',
  },
  'wizard.modeExistingHint': {
    en: 'We will suggest crops that rotate well with what you already grow.',
    ha: 'Za mu ba ka shawarar amfanin gona da za su juya kyauta da abin da ka riga ka shuka.',
  },
  'wizard.modeProspectiveHint': {
    en: 'We will suggest crops that suit your land.',
    ha: 'Za mu ba ka shawarar amfanin gona da suka dace da ƙasarka.',
  },
  'wizard.farmNamePlaceholder': {
    en: 'e.g. my farm by the river',
    ha: 'kamar gonarka a bakin ruwa',
  },
  'wizard.waterQuestion': {
    en: 'Where does your water come from?',
    ha: 'Daga ina ruwa ke fitowa?',
  },
  'wizard.waterOnlyRain': { en: 'Only rain', ha: 'Ruwan sama kawai' },
  'wizard.waterRainIrr': { en: 'Rain and irrigation', ha: 'Ruwan sama da maganan gona' },
  'wizard.waterBoth': { en: 'Both', ha: 'Duka biyu' },
  'wizard.waterIrrigation': { en: 'Irrigation', ha: 'Maganan gona' },
  'wizard.mixedSeason': { en: 'Mixed Season', ha: 'Damina da rani' },
  'wizard.irrigationQuestion': {
    en: 'Tell us more about your water source',
    ha: 'Yi ƙarin bayani game da tushen ruwanka',
  },
  'wizard.irrBorehole': { en: 'Borehole / Tube Well', ha: 'Rijiyar ƙasa / Tsangwama' },
  'wizard.irrRiver': { en: 'River / Stream', ha: 'Kogi / Kagungunun ruwa' },
  'wizard.irrCanalFurrow': { en: 'Canal / Furrow', ha: 'Kogi ƙarami / Tafkin ƙasa' },
  'wizard.irrDrip': { en: 'Drip Irrigation', ha: 'Maganan gona ƙanƙanta' },
  'wizard.irrSprinkler': { en: 'Sprinkler', ha: 'Mafadaɗen ruwa' },
  'wizard.irrHand': { en: 'Hand Irrigation (Buckets)', ha: 'Maganan gona da hannu (bututu)' },
  'wizard.irrBoreholePlain': { en: 'Borehole', ha: 'Rijiyar ƙasa' },
  'wizard.irrCanalPlain': { en: 'Canal', ha: 'Kogi ƙarami' },
  'wizard.irrOther': { en: 'Other', ha: 'Wani' },
  'wizard.soilNotesPrompt': {
    en: 'Anything you know about your soil? (optional)',
    ha: 'Me kani game da kasan? (ba shi da buƙata)',
  },
  'wizard.nextCrops': { en: 'Next: your crops', ha: 'Na gaba: amfanin gona' },
  'wizard.cropSearchLabel': {
    en: 'Which crop? Search by English or Hausa name',
    ha: 'Wane amfanin gona? Nemo ta sunan Turanci ko Hausa',
  },
  'wizard.cropSearchPlaceholder': {
    en: 'Search Dawa, Gero, Wake, Farar wake, Waken soya, Gyada, Masara...',
    ha: 'Nemo Dawa, Gero, Wake, Farar wake, Waken soya, Gyada, Masara...',
  },
  'wizard.whichBean': { en: 'Which bean do you mean?', ha: 'Wane wake kake nufi?' },
  'wizard.beansBody': {
    en: 'People use the word “beans” for a few different crops. Pick the one you mean so we can give you the right advice:',
    ha: 'Mutane suna amfani da kalmar “wake” don wasu amfanin gona daban-daban. Zabi wanda kake nufi don mu ba ka shawarar da ta dace:',
  },
  'wizard.cowpeaOption': { en: 'Cowpea (Wake / Farar wake)', ha: 'Wake (Cowpea / Farar wake)' },
  'wizard.soybeanOption': { en: 'Soybean (Waken soya)', ha: 'Waken soya (Soybean)' },
  'wizard.prevCropLabel': {
    en: 'What did you grow last season?',
    ha: 'Me ka shuka a wannan damina da ta wuce?',
  },
  'wizard.chooseCrop': { en: 'Choose a crop', ha: 'Zabi amfanin gona' },
  'wizard.currCropLabel': { en: 'What are you growing now?', ha: 'Me kake shuka yanzu?' },
  'wizard.plannedCropLabel': {
    en: 'Planned next crop',
    ha: 'Amfanin gona na gaba da kake shirya',
  },
  'wizard.whenPlantLabel': { en: 'When will you plant?', ha: 'Ya za ku shuka?' },
  'wizard.skipIfUnknown': {
    en: 'Skip this if you do not know yet.',
    ha: 'Ka bar wannan idan ba ka san tukuna ba.',
  },
  'wizard.triggerWaitDesc': {
    en: 'Wait until the soil is properly wet before sowing.',
    ha: 'Jira har kasa ta danshi sosai kafin shuka.',
  },
  'wizard.triggerRainsDesc': {
    en: 'Sow as soon as the rains really start.',
    ha: 'Shuka nan take lokacin da ruwan sama ya fara sosai.',
  },
  'wizard.triggerPrepareDesc': {
    en: 'Prepare the land early and sow as soon as the soil is workable.',
    ha: 'Gyara ƙasa da wuri kuma shuka nan take lokacin da za a iya aiki da ita.',
  },
  'wizard.goalsLabel': { en: 'What matters most to you?', ha: 'Me ya fi muhimmanci gare ka?' },
  'wizard.goalSoil': { en: 'Make the soil more fertile', ha: 'Yi kasa mafi shayayye' },
  'wizard.goalHarvest': {
    en: 'Harvest before the rains stop',
    ha: 'Tara amfanin gona kafin ruwan sama ya tsaya',
  },
  'wizard.goalIncome': { en: 'Earn more money', ha: 'Samu ƙari kuɗi' },
  'wizard.goalDrySpells': { en: 'Cope with dry spells', ha: 'Kwatanta da lokutan rani' },
  'wizard.goalSaveWater': { en: 'Save water in the soil', ha: 'Ajiye ruwa a cikin kasa' },
  'wizard.goalFeed': { en: 'Feed my household', ha: 'Ba iyali na abinci' },
  'wizard.goalLessWork': {
    en: 'Spend less on fertiliser and labour',
    ha: 'Biya ƙarancin kuɗi a kan taki da aiki',
  },
  'wizard.nextFields': { en: 'Next: your fields', ha: 'Na gaba: filayenka' },
  'wizard.fieldsCount': { en: 'Your fields ({count})', ha: 'Filayenka ({count})' },
  'wizard.markFieldHint': {
    en: 'Use the map below to mark each field. Draw its outline, or drop a pin for its centre.',
    ha: 'Yi amfani da taswirar da ke ƙasa don nuna kowane fili. Zana iyakarsa, ko a sa alama a tsakiyarsa.',
  },
  'wizard.addAnotherField': { en: 'Add another field', ha: 'Ara wani fili' },
  'wizard.markOnMap': { en: 'Mark your field on the map', ha: 'Nuna filinka a taswira' },
  'wizard.editingField': {
    en: 'Editing {name}. Use the map buttons to draw its outline or drop a pin. It saves automatically.',
    ha: 'Ana gyara {name}. Yi amfani da maɓallan taswira don zana iyakarsa ko sa alama. Yana ajiye kansa.',
  },
  'wizard.yourField': { en: 'your field', ha: 'filinka' },
  'wizard.editingLabel': { en: 'Editing:', ha: 'Ana gyara:' },
  'wizard.chooseFieldToEdit': {
    en: 'Choose which field to edit on the map',
    ha: 'Zabin filin da kake gyara a taswira',
  },
  'wizard.drawOrLocationHint': {
    en: 'Use Draw on the map to trace your field, or Location to drop a pin. Changes save automatically.',
    ha: 'Yi amfani da Zana a taswira don bin iziyar filinka, ko Wuri don sa alama. Canje-canje na ajiye kansu.',
  },
  'wizard.fieldN': { en: 'Field {index}', ha: 'Fili {index}' },
  'wizard.outlineDrawn': { en: 'Outline drawn · {area} ha', ha: 'An zana iyaka · {area} ha' },
  'wizard.drawToSeeSize': {
    en: 'Draw your field on the map to see its size',
    ha: 'Zana filinka a taswira don ganin girman sa',
  },
  'wizard.pinPlaced': {
    en: 'Pin placed · about {uncertainty} m off',
    ha: 'An sa alama · kimanin {uncertainty} m',
  },
  'wizard.dropPinHint': {
    en: 'Drop a pin on the map to mark this field',
    ha: 'Sanya alama a taswira don nuna wannan fili',
  },
  'wizard.removeFieldAria': { en: 'Remove field {index}', ha: 'Cire fili {index}' },
  'wizard.removeField': { en: 'Remove field', ha: 'Cire fili' },
  'wizard.uncertaintyQuestion': {
    en: 'How sure are you about this spot?',
    ha: 'Kuka tabbata me game da wannan wuri?',
  },
  'wizard.sizeSmall': { en: 'Small', ha: 'Ƙarami' },
  'wizard.sizeMedium': { en: 'Medium', ha: 'Matsakaici' },
  'wizard.sizeLarge': { en: 'Large', ha: 'Budu' },
  'wizard.sizeHelp': {
    en: 'Small is about 50 m, medium about 250 m, large about 1,000 m.',
    ha: 'Ƙarami kimanin 50 m, matsakaici kimanin 250 m, budu kimanin 1,000 m.',
  },
  'wizard.reviewBeforeSave': { en: 'Review before saving', ha: 'Duba kafin ajiye' },
  'wizard.finalCheck': { en: 'Final check', ha: 'Duba na ƙarshe' },
  'wizard.checkBeforeSaving': {
    en: 'Check your farm before saving',
    ha: 'Duba gonarka kafin ajiye',
  },
  'wizard.takeALook': {
    en: 'Take a look. Nothing is saved until you tap save.',
    ha: 'Duba kaɗan. Ba wani abin da aka ajiye har sai ka matsa Ajiye.',
  },
  'wizard.waterSupplyReview': { en: 'Water supply', ha: 'Tushen ruwa' },
  'wizard.plantingTriggerLabel': { en: 'Planting trigger', ha: 'Alamtar shuka' },
  'wizard.notGiven': { en: 'Not given', ha: 'Ba a bayar da shi' },
  'wizard.noneMarked': { en: 'None marked', ha: 'Ba a nuna wani' },
  'wizard.noneChosen': { en: 'None chosen', ha: 'Ba a zaɓi wani' },
  'wizard.backToEditing': { en: 'Back to editing', ha: 'Koma gyara' },
  'wizard.savingFarm': { en: 'Saving your farm...', ha: 'Ana ajiye gonarka...' },
  'wizard.saveMyFarm': {
    en: 'Save my farm and fields',
    ha: 'Ajiye gonarka da filayenka',
  },

  // ==== farms-and-landing ====
  'farms.selectFieldHint': {
    en: 'Select a field on the map or in the list to open its farm workspace and reports.',
    ha: 'Zabi fili a taswira ko a jerin don buɗe wurin aikin gonarsa da rahottansa.',
  },
  'farms.loadedPrivately': {
    en: 'Loaded privately from your account. No demonstration farms are shown.',
    ha: 'An loda ta asirin daga asusunka. Ba a nuna wata gona ta gwaji ba.',
  },
  'farms.chooseFarmThenField': {
    en: 'Choose a farm, then open one of its fields.',
    ha: 'Zabi gona, sannan buɗe ɗaya daga filayenta.',
  },
  'farms.wetSeason': { en: '2026 Wet Season', ha: 'Damina 2026' },
  'farms.parcelDrawn': { en: '{area} ha · drawn polygon', ha: '{area} ha · siffa da aka zana' },
  'farms.parcelGps': {
    en: 'GPS point (±{uncertainty} m)',
    ha: 'Wurin GPS (±{uncertainty} m)',
  },
  'farms.notRecorded': { en: 'Not recorded', ha: 'Ba a rubuta ba' },
  'farms.openFieldReport': { en: 'Open field report', ha: 'Bude rahoton fili' },
  'farms.loadError': { en: 'Unable to load your farms.', ha: 'Ba mu iya loda gonakina ba.' },
  'farms.unexpectedData': {
    en: 'The server returned data in an unexpected format.',
    ha: 'Daga sabawa ya zo bayani a tsarin da ba a kira ba.',
  },
  'farms.rainfed': { en: 'Rainfed', ha: 'Bisa ruwan sama' },
  'farms.irrigated': { en: 'Irrigated', ha: 'Maganan gona' },
  'farms.notSure': { en: 'Not sure', ha: 'Ba ni tabbata' },

  'landing.reportExampleTitle': {
    en: 'Example field report layout',
    ha: 'Misalin tsarin rahoton fili',
  },
  'landing.illustrationOnly': {
    en: 'Illustration only. Not live data.',
    ha: 'Hoto ne kawai. Ba bayanan kai tsaye ba.',
  },
  'landing.sampleFiguresNote': {
    en: 'The values below are sample figures used to illustrate the report layout. They are not live observations from any real farm.',
    ha: 'Lambobin da ke ƙasa su ne misali ne kawai don nuna tsarin rahoto. Ba su bayanan kai tsaye daga wata gona ta gaske ba.',
  },
  'landing.rainfallLabel': { en: 'Rainfall (14-day)', ha: 'Ruwan sama (kwanaki 14)' },
  'landing.sourceChirps': {
    en: 'CHIRPS 5.5 km satellite',
    ha: 'CHIRPS 5.5 km daga tauraron dan adam',
  },
  'landing.rootZoneWetness': {
    en: 'Root-zone soil wetness',
    ha: 'Danshin kasa a gindin shuka',
  },
  'landing.sourceSmap': {
    en: 'NASA SMAP 9 km grid',
    ha: 'NASA SMAP 9 km daga tauraron dan adam',
  },
  'landing.topsoilPh': { en: 'Topsoil pH', ha: 'pH na saman kasa' },
  'landing.sourceSoilGrids': { en: 'SoilGrids 250 m cell', ha: 'SoilGrids 250 m sel' },
  'landing.canopyGreenness': { en: 'Canopy greenness', ha: 'Koren gwarin gona' },
  'landing.sourceModis': { en: 'MODIS 250 m composite', ha: 'MODIS 250 m haɗa hotuna' },
  'landing.triggerMet': {
    en: 'Moisture planting trigger: conditions met',
    ha: 'Alamtar shuka ta danshi: an cika sharuɗɗa',
  },
  'landing.triggerMetBody': {
    en: 'Soil moisture reached the 0.18 m³/m³ threshold across three rain events. Workable for sowing.',
    ha: 'Danshin kasa ya kai ma’aunin 0.18 m³/m³ a kwanaki uku na ruwan sama. Za a iya shuka.',
  },
  'landing.rotationLabel': {
    en: 'Tested rotation sequence:',
    ha: 'Jerin juyin shuka da aka gwada:',
  },
  'landing.rotationSample': { en: 'Sorghum (Dawa) to Cowpea (Wake)', ha: 'Dawa zuwa Wake' },
  'landing.viewAllFarms': {
    en: 'View all registered farms on the map',
    ha: 'Duba duk gonakina da aka rajista a taswira',
  },

  'drawer.loadFarmsError': {
    en: 'Your farms could not be loaded right now.',
    ha: 'Ba a iya loda gonakina yanzu ba.',
  },
  'drawer.readFarmsError': {
    en: 'Your farms could not be read right now.',
    ha: 'Ba a iya karanta gonakina yanzu ba.',
  },
  'drawer.expand': { en: 'Expand farms drawer', ha: 'Faɗaɗa akwatin gonaki' },
  'drawer.label': { en: 'Farms drawer', ha: 'Akwatin gonaki' },
  'drawer.title': { en: 'Your farms', ha: 'Gonakinka' },
  'drawer.farmCount': { en: '{count} farms · {area} ha', ha: '{count} gonaki · {area} ha' },
  'drawer.noFieldsYet': { en: 'No fields yet', ha: 'Babu filaye tukuna' },
  'drawer.collapse': { en: 'Collapse drawer', ha: 'Rufe akwatin' },
  'drawer.offline': {
    en: 'You are offline. Showing the farms saved on this device. New changes may not appear until you are online.',
    ha: 'Ba ka da haɗin yanar gizo. Ana nuna gonakina da aka ajiye a wannan na’ura. Sabbin canje-canje ba za su bayyana ba har sai ka samu haɗi.',
  },
  'drawer.loadingAria': { en: 'Loading your farms', ha: 'Ana loda gonakina' },
  'drawer.otherFarmsSafe': {
    en: 'Your other farm details are safe.',
    ha: 'Bayanan wasu gonakinka suna lafiya.',
  },
  'drawer.searchFarms': { en: 'Search farms', ha: 'Nemo gonaki' },
  'drawer.searchPlaceholder': { en: 'Search farms...', ha: 'Nemon gonaki...' },
  'drawer.emptyBody': {
    en: 'Register your land coordinates to view personalized moisture guidance.',
    ha: 'Yi rajistar lambobin ƙasarka don ganin shawarar danshi ta musamman.',
  },
  'drawer.addNewFarm': { en: 'Add New Farm', ha: 'Kara Sabuwar Gona' },

  'rail.openMenu': { en: 'Open sidebar menu', ha: 'Bude menun gefe' },
  'rail.closeMenu': { en: 'Close menu', ha: 'Rufe menu' },
  'rail.workspace': { en: 'Workspace', ha: 'Wurin aiki' },
  'rail.preferences': { en: 'Preferences', ha: 'Abubuwan so' },
  'rail.home': { en: 'DalaShift Home', ha: 'DalaShift: Shafi na farko' },
  'rail.labelAria': { en: 'Workspace navigation rail', ha: 'Jagoron wurin aiki' },

  'nav.openMenu': { en: 'Open navigation menu', ha: 'Bude menu' },
  'nav.closeMenu': { en: 'Close navigation menu', ha: 'Rufe menu' },
  'nav.interfaceLanguage': { en: 'Interface language', ha: 'Harshe' },

  'footer.methodologyLink': {
    en: 'Methodology and data sources',
    ha: 'Hanyar aiki da tushen bayanai',
  },
  'footer.taglineShort': {
    en: 'Climate-informed crop rotation decisions for rain-fed farmers.',
    ha: 'Shawarwar juyin shuka bisa yanayi don manomi na ruwan sama.',
  },

  // ==== data-states ====
  'state.loadingAria': { en: 'Loading field analysis', ha: 'Ana loda binciken fili' },
  'state.emptyNoCropsTitle': {
    en: 'No crops added for this field yet',
    ha: 'Ba a amfani gona a wannan fili tukuna',
  },
  'state.emptyNoCropsBody': {
    en: 'Add the crops you grow now or plan to grow next season. DalaShift will compare your rotation options against your current practice.',
    ha: 'Ƙara amfanin gona da kake shuka yanzu ko da kake shirya shuka a damina ta gaba. DalaShift za ta kwatanta zaɓuɓɓukan juyin shuka da abin da kake yi yanzu.',
  },
  'state.emptyNoCropsAction': { en: 'Add field crops', ha: 'Ƙara amfanin fili' },
  'state.emptyNoParcelsTitle': {
    en: 'No fields added for this farm yet',
    ha: 'Ba a ƙara filaye a wannan gona tukuna',
  },
  'state.emptyNoParcelsBody': {
    en: 'Add a field by placing a pin on the map or drawing its boundary to start your analysis.',
    ha: 'Ƙara fili ta hanyar sa alama a taswira ko zana iyakarsa don fara bincikenka.',
  },
  'state.emptyNoDataTitle': {
    en: 'No saved observations for this field yet',
    ha: 'Babu bayanan da aka ajiye a wannan fili tukuna',
  },
  'state.emptyNoDataBody': {
    en: 'Open the field and refresh to load rainfall, soil moisture and climate records for this location.',
    ha: 'Bude fili kuma sabunta don loda bayanan ruwan sama, danshin kasa da yanayin wannan wuri.',
  },
  'state.emptyNoDataAction': { en: 'Fetch observations', ha: 'Ɗauki bayanai' },
  'state.errorTitle': {
    en: 'We cannot reach {sourceName} right now',
    ha: 'Ba mu iya samun {sourceName} yanzu ba',
  },
  'state.errorBody': {
    en: 'We could not reach the service just now. Your farm and field records are saved and safe. Try again in a few minutes.',
    ha: 'Ba mu iya samun sabis yanzu ba. Bayanan gonarka da filinka suna ajiye kuma suna lafiya. Sake gwadawa bayan minti kaɗan.',
  },
  'state.staleBanner': {
    en: 'Showing saved observations from {date}. Connect to the internet and refresh to check for newer data.',
    ha: 'Ana nuna bayanan da aka ajiye tun {date}. Haɗa da intanet kuma sabunta don duba sabbin bayanai.',
  },
  'state.refreshNow': { en: 'Refresh now', ha: 'Sabunta yanzu' },
  'state.partialBanner': {
    en: 'We could not load details for: {missing}. Everything else is shown below.',
    ha: 'Ba mu iya loda bayani game da: {missing}. Duk abin da ya rage yana nuna ƙasa.',
  },
  'state.someSources': { en: 'some sources', ha: 'wasu tushen bayanai' },
  'state.offlineDefault': {
    en: 'You are offline. We are showing the data saved on this device. Reconnect to load the latest information.',
    ha: 'Ba a da haɗin yanar gizo. Ana nuna bayanan da aka ajiye a wannan na’ura. Haɗa sake don loda sabbin bayanai.',
  },
  'state.sourceEnvironmental': {
    en: 'Environmental data service',
    ha: 'Sabis na bayanan muhalli',
  },
  'state.sourceFarmField': { en: 'Farm and field service', ha: 'Sabis na gona da fili' },
  'state.sourceReport': { en: 'Report service', ha: 'Sabis na rahottoyi' },
  'state.sourceFarmService': { en: 'Farm service', ha: 'Sabis na gona' },
  'state.invalidResponse': {
    en: 'The server returned an invalid response.',
    ha: 'Amsar sabawa ba ta daidai ba.',
  },
  'state.requestFailed': { en: 'Request failed ({status}).', ha: 'Aikin ya gaza ({status}).' },
  'state.unexpectedFarmData': {
    en: 'The server returned farm data in an unexpected format.',
    ha: 'Bayanan gonar daga sabawa ya zo a tsarin da ba a kira ba.',
  },
  'state.na': { en: 'n/a', ha: 'Babu' },

  'dashboard.farmer': { en: 'Farmer', ha: 'Mai gona' },
  'dashboard.loadFarmsFailed': {
    en: 'Unable to load your farms ({status}).',
    ha: 'Ba mu iya loda gonakina ({status}) ba.',
  },
  'dashboard.loadDashboard': {
    en: 'Unable to load your dashboard right now.',
    ha: 'Ba mu iya loda allon bayanai yanzu ba.',
  },
  'dashboard.totalLandArea': {
    en: '{area} ha total land area',
    ha: '{area} ha jimlar fili',
  },
  'dashboard.forFarm': { en: 'For {name}', ha: 'Na {name}' },
  'dashboard.firstFarm': { en: 'your first farm', ha: 'gonarka ta farko' },
  'dashboard.offlineShort': { en: 'You are offline', ha: 'Ba ka da haɗin yanar gizo' },
  'dashboard.gridsValue': { en: 'ISRIC & SMAP', ha: 'ISRIC & SMAP' },
  'dashboard.gridsDetail': {
    en: '250 m soil baseline with ~9 km soil moisture',
    ha: 'Tushen kasa na 250 m da danshin kasa na ~9 km',
  },
  'dashboard.gridsNotLoaded': {
    en: 'Grid details not loaded',
    ha: 'Ba a loda bayanan sel ba',
  },
  'dashboard.privacyValue': { en: 'Protected', ha: 'Kariya' },
  'dashboard.privacyDetail': {
    en: 'Row-Level Security active on your farm records',
    ha: 'Row-Level Security yana aiki a kan bayanan gonarka',
  },
  'dashboard.statusNotLoaded': { en: 'Status not loaded', ha: 'Ba a loda matsayi ba' },
  'dashboard.soilClimateGrids': { en: 'Soil & climate grids', ha: 'Sel na kasa da yanayi' },
  'dashboard.dataPrivacy': { en: 'Data privacy', ha: 'Asirin bayanai' },
  'dashboard.welcomeBack': { en: 'Welcome back, {name}', ha: 'Barka da dawowa, {name}' },
  'dashboard.active': { en: 'Active', ha: 'Aiki' },
  'dashboard.areaPending': { en: 'Area pending', ha: 'Girman fili ana jira' },
  'dashboard.farmingMethod': {
    en: 'Farming method: {method}',
    ha: 'Hanyar girki: {method}',
  },

  'profile.subtitle': {
    en: 'Choose your language and review coordinate privacy settings.',
    ha: 'Zabi harshe kuma duba saitunan asirin lambobin wuri.',
  },
  'profile.languageTitle': { en: 'Preferred Language', ha: 'Harshe da kake so' },
  'profile.languageBody': {
    en: 'Your choice is saved to your profile and applies across the app right away.',
    ha: 'Zaɓin ka ana ajiye shi a profailinka kuma yana aiki a botuna nan take.',
  },
  'profile.redactionTitle': {
    en: 'Coordinate Redaction in Printable Reports',
    ha: 'Rufe lambobin wuri a rahottan da za a iya bugawa',
  },
  'profile.redactionBody': {
    en: 'Exact GPS coordinates are always omitted from printable and shareable field sheets. This privacy protection is enforced and cannot be changed here.',
    ha: 'Lambobin GPS na gaske ana su a kai a ko da yaushe daga takardun fili da za a iya bugawa ko raba. Wannan kariya ta asiri ana kiyaye ita kuma ba za a iya canza ita a nan ba.',
  },
  'profile.alwaysRedacted': { en: 'Always Redacted', ha: 'Ana rufe koyaushe' },
  'profile.signInLoad': {
    en: 'Sign in to load profile preferences.',
    ha: 'Shiga don loda abubuwan so na profaili.',
  },
  'profile.loadError': {
    en: 'Unable to load profile preferences.',
    ha: 'Ba mu iya loda abubuwan so na profaili ba.',
  },
  'profile.invalidResponse': {
    en: 'The profile response was invalid.',
    ha: 'Amsar profaili ba ta daidai ba.',
  },

  'reports.subtitle': {
    en: 'Saved reports and field sheets for your private farms. Exact field coordinates are redacted from every generated report.',
    ha: 'Rahottoyi da takardun fili na gonakinka na asirin. Ana rufe lambobin fili na gaske a kowane rahoto da aka samar.',
  },
  'reports.signInPrompt': {
    en: 'Sign in to see reports for your farms.',
    ha: 'Shiga don ganin rahottan gonakinka.',
  },
  'reports.unexpectedFarms': {
    en: 'The server returned farms in an unexpected format.',
    ha: 'Gonakina daga sabawa sun zo a tsarin da ba a kira ba.',
  },
  'reports.loadReportsError': { en: 'Unable to load reports.', ha: 'Ba mu iya loda rahottoyi ba.' },
  'reports.loadFarmReportsError': {
    en: 'Saved reports could not be loaded for this farm.',
    ha: 'Ba a iya loda rahottan da aka ajiye don wannan gona ba.',
  },
  'reports.unexpectedReports': {
    en: 'Saved reports were in an unexpected format.',
    ha: 'Rahottan da aka ajiye sun zo a tsarin da ba a kira ba.',
  },
  'reports.savedOne': { en: '{count} saved report', ha: '{count} rahoto na ajiye' },
  'reports.savedMany': { en: '{count} saved reports', ha: '{count} rahottan na ajiye' },
  'reports.generated': { en: 'Generated {date}', ha: 'An samar da {date}' },
  'reports.periodRange': { en: '{start} to {end}', ha: '{start} zuwa {end}' },

  'workspace.mixedSeason': { en: 'Mixed season', ha: 'Maganan gona da ruwan sama' },
  'workspace.irrNone': { en: 'None', ha: 'Babu' },
  'workspace.irrHand': { en: 'Hand irrigation (buckets)', ha: 'Maganan gona da hannu (kwando)' },
  'workspace.irrFurrow': { en: 'Canal or furrow', ha: 'Kogi ko ramin gona' },
  'workspace.irrDrip': { en: 'Drip irrigation', ha: 'Ruwan tafawa' },
  'workspace.irrWell': { en: 'Borehole or tube well', ha: 'Rijiyar ƙasa ko rijiyar ruwa' },
  'workspace.irrRiver': { en: 'River or stream', ha: 'Kogi ko rafi' },
  'workspace.cropNameUnavailable': { en: 'Crop name unavailable', ha: 'Ba a sami sunan shuka' },
  'workspace.errLoadFarm': {
    en: 'Unable to load this farm right now.',
    ha: 'Ba mu iya loda wannan gona yanzu ba.',
  },
  'workspace.errCatalog': {
    en: 'The crop catalog could not be loaded. Your saved crops and parcels are still here, but adding a catalog crop may not work until it is available again.',
    ha: 'Ba mu iya loda jerin shuka ba. Amfanin gona da tafiyo naka na ajiye suna nan, amma ƙaraftar shuka na iya ba aiki ba har sai an sake samun shi.',
  },
  'workspace.errAssess': {
    en: 'Unable to assess this farm right now.',
    ha: 'Ba mu iya kimanta wannan gona yanzu ba.',
  },
  'workspace.errSave': {
    en: 'The change could not be saved.',
    ha: 'Ba a iya ajiye canjin ba.',
  },
  'workspace.errCropNotInCatalog': {
    en: 'The crop catalog does not contain {name}. Add it as a custom record instead.',
    ha: 'Jerin shuka ba ya ciki {name}. Shi ne a shigar da shi a matsayin bayanin naka.',
  },
  'workspace.errChooseCropFirst': {
    en: 'Choose a crop from the catalog first.',
    ha: 'Zaɓi shuka daga jerin da farko.',
  },
  'workspace.errEnterParcelName': {
    en: 'Enter a parcel name.',
    ha: 'Shigar da sunan tafiyar gona.',
  },
  'workspace.errEnterCoordinates': {
    en: 'Enter valid longitude and latitude, or draw a polygon on the map.',
    ha: 'Shigar da lambobin wuri masu inganci, ko zana siffa a taswira.',
  },
  'workspace.errEnterFarmName': { en: 'Enter a farm name.', ha: 'Shigar da sunan gona.' },
  'workspace.signInToView': { en: 'Sign in to view this farm', ha: 'Shiga don ganin wannan gona' },
  'workspace.returnToFarms': { en: 'Return to farms', ha: 'Maidowa zuwa gonaki' },
  'workspace.yourFarm': { en: 'Your Farm', ha: 'Gona naka' },
  'workspace.areaUnavailable': { en: 'Area unavailable', ha: 'Ba a sami girman fili' },
  'workspace.holdingArea': { en: '{area} ha holding', ha: '{area} ha na gona' },
  'workspace.parcelCountOne': { en: 'parcel', ha: 'tafiyar gona' },
  'workspace.parcelCountMany': { en: 'parcels', ha: 'tafiyo' },
  'workspace.assessing': { en: 'Assessing parcel…', ha: 'Ana kimanta tafiyar gona…' },
  'workspace.farmSettings': { en: 'Farm settings', ha: 'Saitin gona' },
  'workspace.farmSettingsBody': {
    en: 'Change farm details or remove this farm.',
    ha: 'Canza bayanan gona ko share wannan gona.',
  },
  'workspace.savingChanges': { en: 'Saving changes…', ha: 'Ana ajiye canje-canje…' },
  'workspace.staleInfo': {
    en: 'Some field information is from {date} and may be out of date.',
    ha: 'Wasu bayanan fili sun fito daga {date} kuma na iya zama na dare.',
  },
  'workspace.refreshingNow': { en: 'Refreshing now…', ha: 'Ana sabuntawa yanzu…' },
  'workspace.sectionsAria': {
    en: 'Farm workspace sections',
    ha: 'Sassan wurin aikin gona',
  },
  'workspace.noFieldSelected': { en: 'no field selected', ha: 'babu fili da aka zaɓa' },
  'workspace.gpsPointChip': {
    en: 'GPS point, ±{uncertainty} m',
    ha: 'Wurin GPS, ±{uncertainty} m',
  },
  'workspace.fieldNameFor': { en: 'Field name for {name}', ha: 'Sunan fili na {name}' },
  'workspace.uncertaintyFor': {
    en: 'Uncertainty for {name}',
    ha: 'Rashin tabbas na {name}',
  },
  'workspace.emptyFieldsBody': {
    en: 'Add a GPS point or draw a boundary below to start receiving satellite intelligence.',
    ha: 'Ƙara wurin GPS ko zana iyaka ƙasa don fara samun bayanan tauraron dan adam.',
  },
  'workspace.parcelName': { en: 'Parcel name', ha: 'Sunan tafiyar gona' },
  'workspace.parcelNamePlaceholder': { en: 'e.g. North Field', ha: 'misali: Filin arewa' },
  'workspace.longitude': { en: 'Longitude (°E)', ha: 'Tsawon fili (°E)' },
  'workspace.latitude': { en: 'Latitude (°N)', ha: 'Tafayar fili (°N)' },
  'workspace.uncertainty': { en: 'Uncertainty (m)', ha: 'Rashin tabbas (m)' },
  'workspace.drawingHint': {
    en: 'Drawing: tap corners, then press Done',
    ha: 'Ana zana: matsa kusurwoki sannan matsa An gama',
  },
  'workspace.drawNewField': { en: 'Draw a new field', ha: 'Zana fili sabo' },
  'workspace.boundaryCaptured': {
    en: 'Field boundary captured. Check its size above, then add it.',
    ha: 'An rufe iyakar fili. Duba girman sa a sama sannan ƙara shi.',
  },
  'workspace.cropsRecorded': { en: 'Crops you recorded', ha: 'Amfanin gona da ka rubuta' },
  'workspace.deleteRecordFor': { en: 'Delete {name} record', ha: 'Goge bayanin {name}' },
  'workspace.statusFor': { en: 'Status for {name}', ha: 'Yanayin {name}' },
  'workspace.seasonFor': { en: 'Season for {name}', ha: 'Ranin {name}' },
  'workspace.statusPrevious': { en: 'Previous', ha: 'Wanda ya wuce' },
  'workspace.statusCurrent': { en: 'Current', ha: 'Na yanzu' },
  'workspace.statusPlanned': { en: 'Planned', ha: 'An shirya' },
  'workspace.seasonRainy': { en: 'Rainy', ha: 'Damina' },
  'workspace.seasonDry': { en: 'Dry', ha: 'Rani' },
  'workspace.seasonHarmattan': { en: 'Harmattan', ha: 'Harmattan' },
  'workspace.seasonYearRound': { en: 'Year round', ha: 'Buduwar shekara' },
  'workspace.seasonUnknown': { en: 'Unknown', ha: 'Ba a sani' },
  'workspace.addACrop': { en: 'Add a crop', ha: 'Ƙara shuka' },
  'workspace.addingCropTo': { en: 'Adding a crop to: {name}', ha: 'Ana ƙara shuka ga: {name}' },
  'workspace.cropToAddAria': { en: 'Crop to add', ha: 'Shuka da za a ƙara' },
  'workspace.chooseCatalogCrop': {
    en: 'Choose a catalog crop',
    ha: 'Zaɓi shuka daga jerin',
  },
  'workspace.cropStatusAria': { en: 'Crop status', ha: 'Yanayin shuka' },
  'workspace.cropSeasonAria': { en: 'Crop season', ha: 'Ranin shuka' },
  'workspace.addCropRecord': { en: 'Add crop record', ha: 'Ƙara bayanin shuka' },
  'workspace.statedPriorities': {
    en: 'Stated priorities',
    ha: 'Bukatun da ka bayyana',
  },
  'workspace.noPlantingRule': {
    en: 'No planting rule recorded',
    ha: 'Ba a rubuta ka idar shuka ba',
  },
  'workspace.managementGoals': {
    en: 'Management goals',
    ha: 'Manufofin sarrafa gona',
  },
  'workspace.riskTolerance': {
    en: 'Risk tolerance (0 to 1)',
    ha: 'Karbar haɗari (0 zuwa 1)',
  },
  'workspace.notes': { en: 'Notes', ha: 'Bayani' },
  'workspace.savePriorities': { en: 'Save priorities', ha: 'Ajiye bukatun' },
  'workspace.ruleset': { en: 'Ruleset {version}', ha: 'Dabaru {version}' },
  'workspace.parcelComparison': { en: 'Parcel comparison', ha: 'Kwatanta tafiyo' },
  'workspace.seasonalRainfall': {
    en: 'Seasonal rainfall: {value} mm observed against {normal} mm normal.',
    ha: 'Ruwan saman damina: an lura {value} mm bisa {normal} mm na yau da kullum.',
  },
  'workspace.dataLimits': {
    en: 'What the data cannot tell us',
    ha: 'Abin da bayanai ba za su iya gaya mana ba',
  },
  'workspace.runAssessmentFor': {
    en: 'Run an assessment for {name} to see the trigger, crop shortlist and seasonal outlook.',
    ha: 'Gudanar da kimanta {name} don ganin alamtar shuka, jerin shuka da hasashen damina.',
  },
  'workspace.addGeometryToAssess': {
    en: 'Add parcel geometry to run an assessment.',
    ha: 'Ƙara siffar tafiyar gona don gudanar da kimanta.',
  },
  'workspace.editFarmDescription': {
    en: 'Update the details you recorded for this farm.',
    ha: 'Sabunta bayanan da ka rubuta don wannan gona.',
  },
  'workspace.waterSupplyRegime': {
    en: 'Water supply regime',
    ha: 'Yadda ruwa ke samu',
  },
  'workspace.deleteFarmDescription': {
    en: 'Delete this farm and all its fields? This cannot be undone.',
    ha: 'Share wannan gona da dukkan filayensa? Ba za a iya mayarwa ba.',
  },
  'workspace.deleteFieldTitle': { en: 'Delete field', ha: 'Goge fili' },
  'workspace.deleteFieldDescription': {
    en: 'Delete this field and its boundary? This cannot be undone.',
    ha: 'Share wannan fili da iyakarsa? Ba za a iya mayarwa ba.',
  },
  'workspace.deleteCropTitle': { en: 'Delete crop record', ha: 'Goge bayanin shuka' },
  'workspace.deleteCropDescription': {
    en: 'Delete this crop record? This cannot be undone.',
    ha: 'Share wannan bayanin shuka? Ba za a iya mayarwa ba.',
  },

  'trigger.cardAria': {
    en: 'Planting condition and moisture trigger',
    ha: 'Yanayin shuka da alamtar danshi',
  },
  'trigger.badge': {
    en: 'Moisture-Conditioned Planting Trigger',
    ha: 'Alamtar shuka bisa danshin kasa',
  },
  'trigger.shapedByFarmer': {
    en: "Shaped by farmer's stated rule",
    ha: 'An daidaita bisa ka idar mai gona',
  },
  'trigger.heading': {
    en: 'When to sow: Condition over calendar date',
    ha: 'Lokacin shuka: Yanayi maimakon ranar kalanda',
  },
  'trigger.intro': {
    en: 'In northern Nigeria, early rains are often followed by dry spells. DalaShift evaluates soil moisture and rainfall conditions against your stated risk posture rather than guessing a calendar date.',
    ha: 'A arewa na Najeriya, ruwan saman wuri yawanci yana bin shirin rani. DalaShift yana bincika danshin kasa da ruwan sama bisa abin da ka bayyana maimakon hasashen ranar kalanda.',
  },
  'trigger.activeCondition': {
    en: 'Active Trigger Condition',
    ha: 'Aikin alamtar da yanzu',
  },
  'trigger.matchesFarmer': {
    en: "Matches farmer's stated rule",
    ha: 'Ya dace da ka idar mai gona',
  },
  'trigger.englishLine': { en: 'English: {title}', ha: 'Turanci: {title}' },
  'trigger.riskTradeOff': { en: 'Risk trade-off:', ha: 'Haɗarin canjin hali:' },
  'trigger.compareStrategies': {
    en: 'Compare three moisture-conditioned planting strategies',
    ha: 'Kwatanta dabbobi uku na shuka bisa danshin kasa',
  },
  'trigger.selectedCondition': { en: 'Selected condition', ha: 'Aikin da aka zaɓa' },
  'trigger.farmerRule': { en: "Farmer's stated rule", ha: 'Ka idar mai gona' },
  'trigger.alternativePosture': { en: 'Alternative posture', ha: 'Hanyar canja' },
  'trigger.tradeOff': { en: 'Trade-off:', ha: 'Canjin hali:' },
  'trigger.evidenceHeading': {
    en: 'Current Soil Moisture & Rainfall Evidence',
    ha: 'Shaidar danshin kasa da ruwan sama na yanzu',
  },

  'shortlist.rankFirst': {
    en: 'Best match on the information we have',
    ha: 'Mafi dacewa da bayanan da muke da su',
  },
  'shortlist.rankTied': {
    en: 'These options are tied on the information we have',
    ha: 'Waɗannan zaɓuɓɓukan sun daidaita da bayanan da muke da su',
  },
  'shortlist.rankOther': { en: 'Another option', ha: 'Wani zaɓi' },
  'shortlist.cardAria': {
    en: 'Prospective crop suitability shortlist',
    ha: 'Jerin shuka masu dacewa',
  },
  'shortlist.tieTitle': {
    en: 'Multiple candidate crops are tied on the available regional data',
    ha: 'Ambaliyar shuka sun daidaita da bayanan al umma da ke akwai',
  },
  'shortlist.tieBody': {
    en: 'The rainfall and temperature records for this parcel come from regional grid cells (5.5 km to 55 km), so they cannot separate these top crops on climate alone. Specify whether you have access to supplementary irrigation or select your primary household/market priority to sharpen the comparison.',
    ha: 'Bayanan ruwan sama da zafi na wannan tafiyar gona sun fito daga sel na yanki (daga 5.5 km zuwa 55 km), don haka ba za su iya raba waɗannan shukaki bisa yanayi kaɗai. Bayyana ko kana da ruwan magani ko zaɓi bukatun gidan naka ko kasuwa don inganta kwatanta.',
  },
  'shortlist.orderingBasis': {
    en: 'Shortlist ordering basis',
    ha: 'Hanyar tsara jerin',
  },
  'shortlist.hausaPrefix': { en: 'Hausa: {name}', ha: 'Hausa: {name}' },
  'shortlist.informationGap': { en: 'Information gap:', ha: 'Rashin bayani:' },
  'shortlist.registered': {
    en: 'Registered as planned crop',
    ha: 'An rubuta shi a matsayin shukan da aka shirya',
  },
  'shortlist.chooseCrop': {
    en: 'Choose {cropName} as planned crop',
    ha: 'Zaɓi {cropName} a matsayin shukan da aka shirya',
  },

  'threshold.any': { en: 'any', ha: 'kowane' },
  'threshold.qualitative': { en: 'Qualitative check', ha: 'Bincike mai bayani' },
  'threshold.observed': { en: 'Observed / Modelled', ha: 'An lura / An kirkiro' },
  'threshold.cited': { en: 'Cited Requirement', ha: 'Buƙatar da aka kira' },
  'threshold.rangeTemplate': { en: '{min} to {max} {unit}', ha: '{min} zuwa {max} {unit}' },

  'report.kindFarmSummary': { en: 'Farm summary', ha: 'Taƙaitaccen bayanan gona' },
  'report.kindSeasonal': { en: 'Seasonal outlook', ha: 'Hasashen damina' },
  'report.kindRotationPlan': { en: 'Rotation plan', ha: 'Shirin juyin shuka' },
  'report.kindFieldReport': { en: 'Field report', ha: 'Rahoton fili' },
  'report.methodGpsPoint': { en: 'GPS point', ha: 'Wurin GPS' },
  'report.methodDrawnBoundary': { en: 'Drawn boundary', ha: 'Iyakar da aka zana' },
  'report.locationRecorded': { en: 'Location recorded', ha: 'An rubuta wuri' },
  'report.statedGoal': { en: 'A stated goal', ha: 'Bukatar da aka bayyana' },
  'report.whenToSow': { en: 'When to sow: {condition}', ha: 'Lokacin shuka: {condition}' },
  'report.whatThisMeans': {
    en: 'What this means: {detail}',
    ha: 'Abin da wannan ke nufi: {detail}',
  },
  'report.errIncomplete': {
    en: 'The server returned an incomplete report.',
    ha: 'Daga sabawa ya zo rahoto na ƙare.',
  },
  'report.errGenerate': {
    en: 'Unable to generate this report right now.',
    ha: 'Ba mu iya samar da wannan rahoto yanzu ba.',
  },
  'report.backToFarm': { en: 'Back to farm', ha: 'Maidowa zuwa gona' },
  'report.generating': { en: 'Generating…', ha: 'Ana samarwa…' },
  'report.printSave': { en: 'Print / Save PDF', ha: 'Bude / Ajiye PDF' },
  'report.headerLine': {
    en: '{area} ha total · Generated {date}',
    ha: '{area} ha jimla · An samar da {date}',
  },
  'report.periodLine': { en: 'Period: {start} to {end}', ha: 'Zaman: {start} zuwa {end}' },
  'report.notSpecified': { en: 'Not specified', ha: 'Ba a bayyana' },
  'report.whatMatters': {
    en: 'What matters here: {goals}',
    ha: 'Abin da ke da muhimmanci nan: {goals}',
  },
  'report.coordinatesRedacted': {
    en: 'Coordinates redacted',
    ha: 'An rufe lambobin wuri',
  },
  'report.noFieldAssessment': {
    en: 'No field assessment was prepared. Review this field with the farmer before deciding.',
    ha: 'Ba a shirya binciken fili ba. Duba wannan fili tare da mai gona kafin ka yanke shawara.',
  },
  'report.cropRecordsTitle': {
    en: 'Farmer-supplied crop records',
    ha: 'Bayanan amfanin gona daga mai gona',
  },
  'report.uncataloguedCrop': { en: 'Uncatalogued crop', ha: 'Shuka mara jeri' },
  'report.recorded': { en: 'Recorded', ha: 'An rubuta' },
  'report.cropLine': {
    en: '{label}: {status}, {season} season',
    ha: '{label}: {status}, ranin {season}',
  },
  'report.noCropRecords': {
    en: 'No crop records are available.',
    ha: 'Babu bayanan amfanin gona.',
  },
  'report.noGaps': {
    en: 'No specific gaps were recorded for this report. Check local conditions with the farmer before deciding.',
    ha: 'Ba a rubuta rashin bayani musamman don wannan rahoto. Duba yanayin gida tare da mai gona kafin ka yanke shawara.',
  },
  'report.sourcesTitle': {
    en: 'Sources used in this report',
    ha: 'Majinyatan da aka amfani da su a wannan rahoto',
  },
  'report.noSources': {
    en: 'No external data source was used in this report.',
    ha: 'Ba a amfani da wata tushen bayanai ta waje ba a wannan rahoto.',
  },
  'report.emptyNote': {
    en: "Generate a report to load this farm's saved information and data-source attributions. Exact parcel coordinates are excluded.",
    ha: 'Samar da rahoto don loda bayanan da aka ajiye na wannan gona da majinyatan bayanai. An share lambobin wuri na gaske.',
  },

  // ==== auth-and-methodology ====
  'auth.errMissingCredentials': {
    en: 'Please enter your phone number or email and password.',
    ha: 'Shigar da lambar waya ko imelinka da kalmar sirri.',
  },
  'auth.errPasswordShort': {
    en: 'Your password must be at least 6 characters long.',
    ha: 'Kalmar sirrinka dole ne ta kasance da haruffa 6 ko fiye.',
  },
  'auth.errMissingName': { en: 'Please enter your full name.', ha: 'Shigar da cikakken sunanka.' },
  'auth.errConsent': {
    en: 'Please accept the privacy notice to create an account.',
    ha: 'Yarda da bayanin asiri don kirkirin asusu.',
  },
  'auth.errAccountAccess': {
    en: 'Unable to access your account. Please try again.',
    ha: 'Ba mu iya shiga asusunka ba. Sake gwadawa.',
  },
  'auth.errConnect': {
    en: 'Unable to connect to the account service. Please try again.',
    ha: 'Ba mu iya haɗawa da sabis na asusu ba. Sake gwadawa.',
  },
  'auth.modeAria': { en: 'Authentication mode', ha: 'Hanyar shiga' },
  'auth.pleaseWait': { en: 'Please wait...', ha: 'Da fatan za a jira...' },

  'method.title': {
    en: 'Recommendation methodology and data sources',
    ha: 'Hanyar shawara da tushen bayanai',
  },
  'method.intro': {
    en: 'DalaShift does not use a large language model, arbitrary weights, or composite percentage scores to recommend crops. Every conclusion is a measured or modelled environmental value compared against a cited agronomic threshold, an ordinal rank position with a stated basis, and a qualitative evidence strength rating.',
    ha: 'DalaShift ba ta amfani da manyan kayan magana, ko nauyin da ba shi da ma ana, ko lambobin mataki don ba da shawarar shuka. Kowane ƙarshi shi ne bayanin muhalli da aka auna ko aka kirkiro wanda aka kwatanta da buƙatar noma da aka kira, wuri a jeri da shafi da aka bayyana, da ƙimar ƙarfin shaida mai bayani.',
  },
  'method.noCompositeScores': {
    en: 'No composite scores',
    ha: 'Babu sakamako mai haɗi',
  },
  'method.noCompositeBody': {
    en: 'Soil pH, rainfall, temperature, and nitrogen balance cannot be averaged together. A failure on a hard biological constraint cannot be hidden by a high score elsewhere.',
    ha: 'pH na kasa, ruwan sama, zafi, da daidaiton nitrogen ba za a iya hada su ba. Gaza a wani buƙatar kiba ba a iya boye ta da babban sakamako a wani wuri.',
  },
  'method.resolutionHonesty': { en: 'Resolution honesty', ha: 'Gaskiyar tsarin bayani' },
  'method.resolutionBody': {
    en: 'Coarse grids (about 9 km SMAP and about 55 km POWER) are labelled as regional climate indicators. Sub-field SoilGrids (250 m) is labelled as a modelled baseline requiring local verification.',
    ha: 'Manyan sel (kusan 9 km SMAP da kusan 55 km POWER) an rubuta su a matsayin alamun yanayin yanki. SoilGrids na ƙasa (250 m) an rubuta shi a matsayin tushen da aka kirkiro wanda ke buƙatar tabbatarwa a gida.',
  },
  'method.distinctSources': { en: 'Distinct sources', ha: 'Majinyata daban-daban' },
  'method.distinctBody': {
    en: 'Published literature rules such as Yusuf et al. 2009 and Brouwer and Heibloem 1986 are kept distinct from anonymised smallholder practices reported in Tofa LGA, Kano State, so each source is cited honestly.',
    ha: 'Ka idon ilimin da aka buga kamar Yusuf et al. 2009 da Brouwer da Heibloem 1986 an raba su daga amfanin kananan manomi a Tofa LGA, jihar Kano, don kowane tushen ya sami gaskiyarsa.',
  },
  'method.datasetsTitle': {
    en: 'Earth observation and soil datasets',
    ha: 'Binciken ƙasa daga tauraron dan adam da bayanan kasa',
  },
  'method.datasetsNote': {
    en: 'All external calls run server-side and cache with full provenance in Supabase PostGIS.',
    ha: 'Dukkan kira zuwa waje ana yi su a bayanan gida kuma ana ajiye su a Supabase PostGIS tare da asalinsu.',
  },
  'method.scrollHint': {
    en: 'Scroll sideways to see every column.',
    ha: 'Ja gefe don ganin kowane ginshiƙi.',
  },
  'method.colDataset': { en: 'Dataset', ha: 'Bayanan' },
  'method.colVariables': { en: 'Variables', ha: 'Abubuwa' },
  'method.colResolution': { en: 'Spatial resolution', ha: 'Girman filin bayani' },
  'method.colCadence': { en: 'Cadence', ha: 'Yadda ake sabuntawa' },
  'method.colNature': { en: 'Nature', ha: 'Nau’in' },
  'method.colRole': { en: 'Role in engine', ha: 'Rawar injin' },
  'method.catalogTitle': {
    en: 'Crop reference catalog and cited thresholds',
    ha: 'Jerin bincike na amfanin gona da bukatan da aka kira',
  },
  'method.catalogNote': {
    en: 'Indicative seasonal water need ranges from Brouwer and Heibloem (1986) are rough reference bands, never hard pass or fail cutoffs.',
    ha: 'Kewayen buƙatar ruwa na damina daga Brouwer da Heibloem (1986) misali ne kawai na bambanci, ba dole ba na gaza ko wucewa.',
  },
  'method.fixesNitrogen': {
    en: 'Fixes biological N',
    ha: 'Yana gyara nitrogen na kiba',
  },
  'method.consumesNitrogen': {
    en: 'Consumes soil N',
    ha: 'Yana amfani da nitrogen na kasa',
  },
  'method.waterNeed': { en: 'Water need', ha: 'Buƙatar ruwa' },
  'method.tempRange': { en: 'Temp range', ha: 'Zafin tsari' },
  'method.soilPh': { en: 'Soil pH', ha: 'pH na kasa' },
  'method.rangeMm': { en: '{min} to {max} mm', ha: '{min} zuwa {max} mm' },
  'method.rangeC': { en: '{min} to {max} °C', ha: '{min} zuwa {max} °C' },
  'method.rangePlain': { en: '{min} to {max}', ha: '{min} zuwa {max}' },
  'method.applyCta': {
    en: 'Apply this methodology to your fields',
    ha: 'Yi amfani da wannan hanya a kan filayenka',
  },
};
