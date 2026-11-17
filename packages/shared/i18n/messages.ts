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
  'nav.addFarm': { en: 'Add a farm', ha: 'Ara gona' },
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
  'landing.howStep1': { en: '1. Add your farm', ha: '1. Ara gonarka' },
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
  'farms.addFarm': { en: 'Add a farm', ha: 'Ara gona' },
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
};
