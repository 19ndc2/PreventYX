import { db } from "@workspace/db";
import { cancerTypesTable, preventionPathwaysTable } from "@workspace/db/schema";

const cancerTypes = [
  {
    name: "Lung Cancer",
    description: "Lung cancer is the leading cause of cancer-related death in Canada. It forms in the tissues of the lung, usually in the cells lining air passages.",
    canadianIncidenceRate: "65.0 per 100,000",
    commonRiskFactors: ["Tobacco smoking", "Secondhand smoke exposure", "Radon gas exposure", "Asbestos exposure", "Air pollution", "Family history"],
    earlySymptoms: ["Persistent cough", "Coughing up blood", "Chest pain", "Shortness of breath", "Unexplained weight loss", "Fatigue"],
    screeningAge: 50,
    icon: "lungs",
  },
  {
    name: "Colorectal Cancer",
    description: "Colorectal cancer is cancer of the colon or rectum. It is the second most common cause of cancer death in Canada.",
    canadianIncidenceRate: "54.0 per 100,000",
    commonRiskFactors: ["Age over 50", "Family history", "Inflammatory bowel disease", "Red and processed meat consumption", "Physical inactivity", "Obesity", "Heavy alcohol use", "Smoking"],
    earlySymptoms: ["Change in bowel habits", "Blood in stool", "Abdominal pain", "Unexplained weight loss", "Fatigue", "Feeling of incomplete bowel emptying"],
    screeningAge: 50,
    icon: "colon",
  },
  {
    name: "Breast Cancer",
    description: "Breast cancer is the most common cancer among Canadian women. It can also affect men. Most breast cancers form in the milk ducts or lobules.",
    canadianIncidenceRate: "124.0 per 100,000 (women)",
    commonRiskFactors: ["Being female", "Age over 50", "Family history / BRCA mutations", "Dense breast tissue", "Hormone replacement therapy", "Alcohol consumption", "Obesity after menopause", "Late pregnancy or no children"],
    earlySymptoms: ["Lump in breast or underarm", "Change in breast size or shape", "Nipple discharge", "Dimpling or redness of skin", "Nipple turning inward", "Swelling in armpit"],
    screeningAge: 50,
    icon: "ribbon",
  },
  {
    name: "Prostate Cancer",
    description: "Prostate cancer is the most common cancer in Canadian men. It develops in the prostate gland, which is part of the male reproductive system.",
    canadianIncidenceRate: "112.0 per 100,000 (men)",
    commonRiskFactors: ["Age over 50", "Family history", "African or Caribbean descent", "High-fat diet", "Obesity"],
    earlySymptoms: ["Frequent urination", "Difficulty starting urination", "Weak urine stream", "Blood in urine or semen", "Pain in hips, back, or pelvis", "Erectile dysfunction"],
    screeningAge: 50,
    icon: "shield",
  },
  {
    name: "Skin Cancer (Melanoma)",
    description: "Melanoma is the most serious type of skin cancer. It develops from melanocytes, the cells that give skin its colour. Canada sees about 8,800 new cases per year.",
    canadianIncidenceRate: "23.0 per 100,000",
    commonRiskFactors: ["UV radiation exposure", "Tanning bed use", "Fair skin, light hair, blue eyes", "History of sunburn", "Large number of moles", "Family history", "Weakened immune system"],
    earlySymptoms: ["New or changing mole", "Asymmetric mole", "Irregular mole borders", "Multiple colours in a mole", "Mole larger than 6mm", "Itching or bleeding mole"],
    screeningAge: 30,
    icon: "sun",
  },
  {
    name: "Cervical Cancer",
    description: "Cervical cancer develops in the cervix, the lower part of the uterus. Almost all cases are caused by human papillomavirus (HPV), which is preventable through vaccination.",
    canadianIncidenceRate: "8.5 per 100,000 (women)",
    commonRiskFactors: ["HPV infection", "Not having received HPV vaccine", "Smoking", "Weakened immune system", "Long-term use of oral contraceptives", "Multiple sexual partners", "Early sexual activity"],
    earlySymptoms: ["Abnormal vaginal bleeding", "Unusual vaginal discharge", "Pain during sex", "Pelvic pain", "Bleeding after menopause"],
    screeningAge: 25,
    icon: "female",
  },
  {
    name: "Bladder Cancer",
    description: "Bladder cancer begins in the cells of the bladder lining. It is more common in men and older adults. Most cases are diagnosed at an early stage.",
    canadianIncidenceRate: "21.0 per 100,000",
    commonRiskFactors: ["Tobacco smoking", "Chemical exposure (dyes, rubber, leather)", "Chronic bladder irritation", "Age over 55", "Male sex", "Family history", "Prior cancer treatment"],
    earlySymptoms: ["Blood in urine (hematuria)", "Frequent urination", "Painful urination", "Back or pelvic pain", "Urinary urgency"],
    screeningAge: 55,
    icon: "droplet",
  },
  {
    name: "Thyroid Cancer",
    description: "Thyroid cancer occurs in the thyroid gland. It is often detected early and has a high survival rate. Women are 3 times more likely than men to develop thyroid cancer.",
    canadianIncidenceRate: "17.0 per 100,000",
    commonRiskFactors: ["Female sex", "Radiation exposure to head/neck", "Family history", "Iodine deficiency", "Certain inherited conditions", "Age (30s-60s)"],
    earlySymptoms: ["Lump in neck", "Swollen lymph nodes", "Hoarse voice", "Difficulty swallowing", "Difficulty breathing", "Throat or neck pain"],
    screeningAge: 30,
    icon: "thyroid",
  },
];

const preventionPathways = [
  {
    cancerTypeId: 1,
    riskLevel: "low",
    riskPercentageMin: 0,
    riskPercentageMax: 15,
    title: "Lung Cancer Prevention — Low Risk",
    description: "Maintain current healthy habits and take preventive steps to keep your lung cancer risk minimal.",
    actions: [
      { id: 1, title: "Annual wellness visit", description: "Visit your family doctor annually for a general health check.", frequency: "Annually", provider: "Family Physician", urgent: false },
      { id: 2, title: "Radon test your home", description: "Test your home for radon gas, a leading cause of lung cancer in non-smokers.", frequency: "Once, then every 5 years", provider: "Self (test kit)", urgent: false },
      { id: 3, title: "Air quality awareness", description: "Monitor indoor and outdoor air quality; use air purifiers if needed.", frequency: "Ongoing", provider: "Self", urgent: false },
    ],
    screeningFrequency: "No routine screening required at this risk level",
    lifestyleChanges: ["Maintain smoke-free environment", "Exercise regularly", "Avoid secondhand smoke exposure", "Test home for radon"],
    priority: 3,
  },
  {
    cancerTypeId: 1,
    riskLevel: "moderate",
    riskPercentageMin: 15,
    riskPercentageMax: 40,
    title: "Lung Cancer Prevention — Moderate Risk",
    description: "Your risk factors warrant closer attention and proactive steps to protect your lung health.",
    actions: [
      { id: 1, title: "Discuss screening eligibility with doctor", description: "Ask your doctor about low-dose CT (LDCT) scan eligibility based on your age and smoking history.", frequency: "At next appointment", provider: "Family Physician", urgent: false },
      { id: 2, title: "Smoking cessation program", description: "If you smoke, enroll in a provincially-funded cessation program.", frequency: "As soon as possible", provider: "Family Physician / Pharmacist", urgent: true },
      { id: 3, title: "Radon home test", description: "Test your home for radon — Canada has one of the highest radon exposures globally.", frequency: "Once", provider: "Self (Health Canada kit)", urgent: false },
      { id: 4, title: "Pulmonary function test", description: "Consider a baseline pulmonary function test.", frequency: "Once, then as recommended", provider: "Specialist", urgent: false },
    ],
    screeningFrequency: "Discuss LDCT eligibility; potential annual screening if high-risk criteria met",
    lifestyleChanges: ["Quit smoking immediately", "Avoid secondhand smoke", "Test home for radon", "Regular aerobic exercise", "Maintain healthy weight"],
    priority: 2,
  },
  {
    cancerTypeId: 1,
    riskLevel: "high",
    riskPercentageMin: 40,
    riskPercentageMax: 100,
    title: "Lung Cancer Prevention — High Risk",
    description: "You have significant risk factors for lung cancer. Immediate action and regular screening are strongly recommended.",
    actions: [
      { id: 1, title: "Urgent smoking cessation", description: "Speak to your doctor about prescription cessation aids and enroll in the provincial quit program.", frequency: "Immediately", provider: "Family Physician", urgent: true },
      { id: 2, title: "Annual low-dose CT scan", description: "Annual LDCT screening for eligible high-risk individuals (age 55-74 with 30+ pack-year history). Ask your doctor for a referral.", frequency: "Annually", provider: "Radiologist / Respirologist", urgent: true },
      { id: 3, title: "Chest X-ray baseline", description: "Get a baseline chest X-ray if LDCT not yet available.", frequency: "Now, then as recommended", provider: "Radiologist", urgent: false },
      { id: 4, title: "Asbestos/occupational exposure review", description: "Inform your doctor of any occupational exposures to carcinogens.", frequency: "At next appointment", provider: "Occupational Health Physician", urgent: false },
    ],
    screeningFrequency: "Annual low-dose CT scan (if eligible) — discuss with your doctor immediately",
    lifestyleChanges: ["Quit smoking urgently", "Completely avoid secondhand smoke", "Remediate radon if found in home", "Reduce occupational chemical exposures", "Maintain healthy BMI", "Eat antioxidant-rich diet"],
    priority: 1,
  },
  {
    cancerTypeId: 2,
    riskLevel: "low",
    riskPercentageMin: 0,
    riskPercentageMax: 15,
    title: "Colorectal Cancer Prevention — Low Risk",
    description: "Standard preventive care is sufficient at this stage. Focus on healthy diet and regular screening when you reach recommended age.",
    actions: [
      { id: 1, title: "Start FIT screening at 50", description: "Fecal immunochemical test (FIT) every 1-2 years starting at age 50.", frequency: "Every 1-2 years from age 50", provider: "Family Physician", urgent: false },
      { id: 2, title: "Dietary fibre increase", description: "Aim for 25-38g of fibre daily from fruits, vegetables, and whole grains.", frequency: "Daily", provider: "Self / Dietitian", urgent: false },
    ],
    screeningFrequency: "FIT test every 1-2 years starting at age 50; colonoscopy every 10 years as alternative",
    lifestyleChanges: ["Eat high-fibre diet", "Limit red and processed meat", "Reduce alcohol consumption", "Exercise regularly", "Maintain healthy weight", "Don't smoke"],
    priority: 3,
  },
  {
    cancerTypeId: 2,
    riskLevel: "moderate",
    riskPercentageMin: 15,
    riskPercentageMax: 40,
    title: "Colorectal Cancer Prevention — Moderate Risk",
    description: "Your risk factors require more proactive screening and lifestyle modification to prevent colorectal cancer.",
    actions: [
      { id: 1, title: "Earlier screening discussion", description: "If you have family history, discuss starting FIT or colonoscopy before age 50.", frequency: "At next appointment", provider: "Family Physician", urgent: false },
      { id: 2, title: "Annual FIT test", description: "Stool blood test every year, not every 2 years given your risk.", frequency: "Annually", provider: "Family Physician", urgent: false },
      { id: 3, title: "Dietitian consultation", description: "Work with a dietitian to optimize your diet for cancer prevention.", frequency: "Once, with annual follow-ups", provider: "Registered Dietitian", urgent: false },
    ],
    screeningFrequency: "Annual FIT test; colonoscopy every 5-10 years; earlier start if family history present",
    lifestyleChanges: ["High-fibre, plant-forward diet", "Eliminate processed meats", "Limit red meat to <2 servings/week", "150+ minutes of exercise per week", "Reduce alcohol significantly", "Quit smoking"],
    priority: 2,
  },
  {
    cancerTypeId: 3,
    riskLevel: "moderate",
    riskPercentageMin: 15,
    riskPercentageMax: 40,
    title: "Breast Cancer Prevention — Moderate Risk",
    description: "Start regular mammogram screening and adopt protective lifestyle habits to reduce your breast cancer risk.",
    actions: [
      { id: 1, title: "Mammogram screening", description: "Get a mammogram every 2 years starting at age 50, or earlier if family history.", frequency: "Every 2 years", provider: "Radiologist / Screening Program", urgent: false },
      { id: 2, title: "Clinical breast exam", description: "Annual clinical breast examination by your doctor.", frequency: "Annually", provider: "Family Physician or Gynecologist", urgent: false },
      { id: 3, title: "Breast self-exam education", description: "Learn and practice regular breast self-examination.", frequency: "Monthly", provider: "Self / Family Physician", urgent: false },
      { id: 4, title: "Discuss HRT risks", description: "If you use hormone replacement therapy, discuss risks and alternatives with your doctor.", frequency: "At next appointment", provider: "Family Physician", urgent: false },
    ],
    screeningFrequency: "Mammogram every 2 years (age 50-74); clinical breast exam annually",
    lifestyleChanges: ["Maintain healthy weight", "Limit alcohol to <1 drink/day", "Exercise 150+ min/week", "Eat plant-rich diet", "Limit hormone therapy use", "Breastfeed if possible"],
    priority: 2,
  },
  {
    cancerTypeId: 3,
    riskLevel: "high",
    riskPercentageMin: 40,
    riskPercentageMax: 100,
    title: "Breast Cancer Prevention — High Risk (BRCA / Strong Family History)",
    description: "With your elevated risk, enhanced screening and potential preventive medical interventions are recommended.",
    actions: [
      { id: 1, title: "BRCA genetic counselling", description: "Request a referral to a genetic counsellor to discuss BRCA1/BRCA2 testing.", frequency: "Urgently — within 3 months", provider: "Genetic Counsellor", urgent: true },
      { id: 2, title: "Annual MRI + Mammogram", description: "High-risk women may benefit from annual breast MRI in addition to mammogram.", frequency: "Annually", provider: "Radiologist / Oncologist", urgent: true },
      { id: 3, title: "Discuss chemoprevention", description: "Ask your doctor about tamoxifen or other preventive medications for high-risk women.", frequency: "At next appointment", provider: "Oncologist", urgent: false },
      { id: 4, title: "Consider prophylactic surgery", description: "For very high-risk women (BRCA+), discuss prophylactic mastectomy with a specialist.", frequency: "Once, as part of shared decision-making", provider: "Oncologist / Surgeon", urgent: false },
    ],
    screeningFrequency: "Annual mammogram + MRI starting at age 30 (or 25 if family history suggests); clinical breast exam every 6 months",
    lifestyleChanges: ["Avoid alcohol entirely", "Maintain healthy BMI", "Intensive regular exercise", "Avoid hormone therapy if possible", "Plant-rich whole-food diet", "Avoid environmental estrogen exposures"],
    priority: 1,
  },
  {
    cancerTypeId: 4,
    riskLevel: "moderate",
    riskPercentageMin: 15,
    riskPercentageMax: 40,
    title: "Prostate Cancer Prevention — Moderate Risk",
    description: "Regular discussions with your doctor about PSA testing and healthy lifestyle changes are key at this stage.",
    actions: [
      { id: 1, title: "Discuss PSA testing with doctor", description: "Have an informed discussion about the benefits and risks of PSA testing starting at age 50.", frequency: "Annually from age 50", provider: "Family Physician", urgent: false },
      { id: 2, title: "Digital rectal exam", description: "Annual DRE as part of your prostate health check.", frequency: "Annually", provider: "Family Physician", urgent: false },
      { id: 3, title: "Dietary modifications", description: "Reduce saturated fats; increase tomato-based foods (lycopene).", frequency: "Ongoing", provider: "Self / Dietitian", urgent: false },
    ],
    screeningFrequency: "PSA test every 1-2 years (age 50+); start earlier if African or Caribbean heritage or strong family history",
    lifestyleChanges: ["Reduce saturated and trans fats", "Eat tomato-based foods rich in lycopene", "Exercise regularly", "Maintain healthy weight", "Limit dairy and red meat"],
    priority: 2,
  },
  {
    cancerTypeId: 5,
    riskLevel: "moderate",
    riskPercentageMin: 15,
    riskPercentageMax: 40,
    title: "Skin Cancer Prevention — Moderate Risk",
    description: "Consistent sun protection habits and regular skin checks will significantly reduce your skin cancer risk.",
    actions: [
      { id: 1, title: "Annual skin check by doctor", description: "Ask your family doctor to check your skin for suspicious moles annually.", frequency: "Annually", provider: "Family Physician / Dermatologist", urgent: false },
      { id: 2, title: "Monthly self-skin exam", description: "Perform a full-body skin self-exam each month using the ABCDE method.", frequency: "Monthly", provider: "Self", urgent: false },
      { id: 3, title: "Sunscreen habit", description: "Apply broad-spectrum SPF 30+ sunscreen daily on exposed skin.", frequency: "Daily", provider: "Self", urgent: false },
      { id: 4, title: "Stop tanning bed use", description: "Completely discontinue the use of tanning beds.", frequency: "Immediately", provider: "Self", urgent: true },
    ],
    screeningFrequency: "Annual clinical skin exam; monthly self-exam; immediate referral for suspicious moles",
    lifestyleChanges: ["Daily SPF 30+ sunscreen", "Avoid tanning beds entirely", "Wear protective clothing (UPF 50+)", "Seek shade between 11am-3pm", "Wear wide-brimmed hat and sunglasses", "Check skin monthly with ABCDE method"],
    priority: 2,
  },
  {
    cancerTypeId: 6,
    riskLevel: "low",
    riskPercentageMin: 0,
    riskPercentageMax: 15,
    title: "Cervical Cancer Prevention — Standard Risk",
    description: "Regular Pap tests and HPV vaccination are highly effective at preventing cervical cancer.",
    actions: [
      { id: 1, title: "Regular Pap test", description: "Get a Pap test every 3 years starting at age 25, or as recommended by your province.", frequency: "Every 3 years", provider: "Family Physician / Gynecologist", urgent: false },
      { id: 2, title: "HPV vaccination", description: "HPV vaccine is recommended for women up to age 45 if not already vaccinated.", frequency: "Once (series of 2-3 doses)", provider: "Family Physician / Public Health", urgent: false },
      { id: 3, title: "HPV test consideration", description: "HPV testing may be offered alongside or instead of Pap in some provinces.", frequency: "Every 3-5 years", provider: "Family Physician", urgent: false },
    ],
    screeningFrequency: "Pap test every 3 years (age 25-69); HPV co-test available in some provinces",
    lifestyleChanges: ["Get HPV vaccinated", "Don't smoke", "Practice safe sex", "Maintain healthy immune system", "Attend all scheduled screenings"],
    priority: 2,
  },
];

async function seed() {
  console.log("Seeding cancer types...");

  await db.delete(preventionPathwaysTable);
  await db.delete(cancerTypesTable);

  const insertedTypes = await db.insert(cancerTypesTable).values(cancerTypes).returning();
  console.log(`Inserted ${insertedTypes.length} cancer types`);

  const typeMap = new Map(insertedTypes.map(t => [t.name, t.id]));

  const mappedPathways = preventionPathways.map(p => ({
    ...p,
    cancerTypeId: insertedTypes[p.cancerTypeId - 1]?.id ?? p.cancerTypeId,
  }));

  const insertedPathways = await db.insert(preventionPathwaysTable).values(mappedPathways).returning();
  console.log(`Inserted ${insertedPathways.length} prevention pathways`);

  console.log("Seed complete!");
}

seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
