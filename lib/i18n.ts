import { cookies } from "next/headers";

export type Locale = "fr" | "en" | "ar";

const dictionaries = {
  fr: {
    home: "Accueil",
    myAccount: "My Account",
    start: "Start",
    bookAppointment: "Prise de RDV",
    editProfile: "Modifiez votre profil",
    attachDocuments: "Attachez vos documents",
    selectService: "Sélectionnez le service consulaire concerné.",
    selectFormality: "Choisissez la formalité à effectuer au sein de ce service.",
    calendarStep: "Réservez un créneau en fonction des disponibilités.",
    requiredDocs: "Pièces requises",
    consularTax: "Taxe consulaire",
    contact: "Contact",
    book: "Prendre rendez-vous",
    back: "Retour",
    step: "Étape",
    importantNote: "Note importante",
    yourDepartment: "Votre département de résidence",
    checkDepartment: "Vérifier",
    departmentHint: "Saisissez le numéro de votre département (ex. 75, 92, 13…)",
    login: "Connexion",
    logout: "Déconnexion",
    staffArea: "Espace employés",
    adminArea: "Administration",
    email: "Email",
    password: "Mot de passe",
    otpSent: "Un code à 6 chiffres a été généré. En mode démo, il s'affiche ci-dessous (en production : envoyé par email).",
    otpCode: "Code de vérification",
    verify: "Vérifier",
    save: "Enregistrer",
    saved: "Enregistré ✔",
    upload: "Envoyer le fichier",
    profileSaved: "Profil enregistré avec succès.",
  },
  en: {
    home: "Home",
    myAccount: "My Account",
    start: "Start",
    bookAppointment: "Book an appointment",
    editProfile: "Edit your profile",
    attachDocuments: "Attach your documents",
    selectService: "Select the relevant consular service.",
    selectFormality: "Choose the formality within this service.",
    calendarStep: "Book a slot based on availability.",
    requiredDocs: "Required documents",
    consularTax: "Consular fee",
    contact: "Contact",
    book: "Book now",
    back: "Back",
    step: "Step",
    importantNote: "Important note",
    yourDepartment: "Your department of residence",
    checkDepartment: "Check",
    departmentHint: "Enter your department number (e.g. 75, 92, 13…)",
    login: "Sign in",
    logout: "Sign out",
    staffArea: "Staff area",
    adminArea: "Administration",
    email: "Email",
    password: "Password",
    otpSent: "A 6-digit code was generated. In demo mode it is displayed below (in production: sent by email).",
    otpCode: "Verification code",
    verify: "Verify",
    save: "Save",
    saved: "Saved ✔",
    upload: "Upload file",
    profileSaved: "Profile saved successfully.",
  },
  ar: {
    home: "الرئيسية",
    myAccount: "حسابي",
    start: "ابدأ",
    bookAppointment: "حجز موعد",
    editProfile: "عدّل ملفك الشخصي",
    attachDocuments: "أرفق مستنداتك",
    selectService: "اختر الخدمة القنصلية المعنية.",
    selectFormality: "اختر المعاملة ضمن هذه الخدمة.",
    calendarStep: "احجز موعدًا حسب التوفر.",
    requiredDocs: "المستندات المطلوبة",
    consularTax: "الرسم القنصلي",
    contact: "اتصال",
    book: "احجز الآن",
    back: "رجوع",
    step: "الخطوة",
    importantNote: "ملاحظة مهمة",
    yourDepartment: "مقاطعة إقامتك",
    checkDepartment: "تحقق",
    departmentHint: "أدخل رقم المقاطعة (مثال: 75، 92، 13…)",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    staffArea: "منطقة الموظفين",
    adminArea: "الإدارة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    otpSent: "تم إنشاء رمز من 6 أرقام. في الوضع التجريبي يظهر أدناه (في الإنتاج: يُرسل بالبريد).",
    otpCode: "رمز التحقق",
    verify: "تحقق",
    save: "حفظ",
    saved: "تم الحفظ ✔",
    upload: "إرسال الملف",
    profileSaved: "تم حفظ الملف الشخصي بنجاح.",
  },
} as const;

export type Dict = (typeof dictionaries)["fr"];

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const l = jar.get("locale")?.value;
  return l === "en" || l === "ar" ? l : "fr";
}

export async function t(): Promise<Dict> {
  const locale = await getLocale();
  return dictionaries[locale] as Dict;
}

export function dir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
