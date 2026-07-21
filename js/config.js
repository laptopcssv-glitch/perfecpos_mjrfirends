// ================================================================
// CONFIGURACIÓN DE LA EMPRESA (WHITE-LABEL)
// ================================================================

const CONFIG_KEY = 'pp_company_config';

// Configuración por defecto (la actual de Perfect Pet)
const DEFAULT_CONFIG = {
    companyName: 'Perfect Pet',
    address: 'AV. HIDALGO #65, AMECAMECA',
    phone: '55 1234 5678',
    email: 'contacto@perfectpet.com',
    website: '@perfect_pet_amecameca',
    slogan: 'El cuidado que tu mascota merece',
    logoBase64: LOGO,
    emailjs: {
        serviceId: EJS_SVC,
        templateId: EJS_TPL,
        publicKey: EJS_KEY
    }
};

function getCompanyConfig() {
    const stored = db(CONFIG_KEY);
    if (stored) {
        return { ...DEFAULT_CONFIG, ...stored };
    }
    return DEFAULT_CONFIG;
}

function saveCompanyConfig(config) {
    db(CONFIG_KEY, config);
}

function getLogoDataUrl() {
    const config = getCompanyConfig();
    return config.logoBase64 ? 'data:image/jpeg;base64,' + config.logoBase64 : '';
}

function applyLogoToElement(elementId) {
    const el = g(elementId);
    if (el) {
        const logoData = getLogoDataUrl();
        if (logoData) {
            el.src = logoData;
        }
    }
}

function applyLogoAll() {
    const logoData = getLogoDataUrl();
    if (!logoData) return;
    document.querySelectorAll('.company-logo, #loginLogo, #setupLogo, #sidebarLogo').forEach(el => {
        if (el) el.src = logoData;
    });
}

function loadConfigForm() {
    const config = getCompanyConfig();
    g('configCompanyName').value = config.companyName || '';
    g('configAddress').value = config.address || '';
    g('configPhone').value = config.phone || '';
    g('configEmail').value = config.email || '';
    g('configWebsite').value = config.website || '';
    g('configSlogan').value = config.slogan || '';
    g('configEjsService').value = config.emailjs?.serviceId || '';
    g('configEjsTemplate').value = config.emailjs?.templateId || '';
    g('configEjsKey').value = config.emailjs?.publicKey || '';
    
    const preview = g('configLogoPreview');
    const logoData = getLogoDataUrl();
    if (logoData) preview.src = logoData;
}

function previewConfigLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        g('configLogoPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function saveCompanyConfigForm() {
    const config = {
        companyName: g('configCompanyName').value.trim() || 'Mi Negocio',
        address: g('configAddress').value.trim() || '',
        phone: g('configPhone').value.trim() || '',
        email: g('configEmail').value.trim() || '',
        website: g('configWebsite').value.trim() || '',
        slogan: g('configSlogan').value.trim() || '',
        logoBase64: DEFAULT_CONFIG.logoBase64,
        
    };
    
    const preview = g('configLogoPreview');
    if (preview.src && preview.src.startsWith('data:image')) {
        const base64Data = preview.src.split(',')[1];
        if (base64Data) config.logoBase64 = base64Data;
    }
    
    saveCompanyConfig(config);
    toast('✅ Configuración guardada correctamente');
    
    applyLogoAll();
    const titleEl = document.querySelector('title');
    if (titleEl) titleEl.textContent = config.companyName + ' - Sistema POS';
    
    loadConfigForm();
}