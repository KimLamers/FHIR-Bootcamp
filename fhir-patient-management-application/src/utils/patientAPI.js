export const fetchPatients = async ({ given, family, phone }) => {
    let url = 'https://hapi.fhir.org/baseR4/Patient?';
    const params = [];

    if (given) params.push(`given=${encodeURIComponent(given)}`);
    if (family) params.push(`family=${encodeURIComponent(family)}`);
    if (phone) params.push(`telecom=${encodeURIComponent(phone)}`);

    url += params.join('&');

    const res = await fetch(url);
    const json = await res.json();

    if (!json.entry) return [];

    return json.entry.map(entry => {
        const resource = entry.resource;
        const name = resource.name?.[0] || {};
        return {
            id: resource.id,
            given: name.given?.[0] || '',
            family: name.family || '',
            gender: resource.gender || '',
            birthDate: resource.birthDate || '',
            phone: resource.telecom?.[0]?.value || ''
        };
    });
};
