"use client";
import { useEffect, useState } from "react";
import { FHIR_BASE_URL } from "../config";

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token") || "";
  }
  return "";
}

function parseJwt(token: string) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const TABS = [
  { key: "medications", label: "Medications" },
  { key: "labs", label: "Lab Reports" },
  { key: "vitals", label: "Vital Signs" },
];

export default function Dashboard() {
  const [token, setToken] = useState<string>("");
  const [patient, setPatient] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);
  // Hardcode the patientId for Epic Sandbox test patient 'fhircamila'
  const patientId = 'erXuFYUfucBZaryVksYEcMg3';

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setError("No access token found. Please sign in first.");
      return;
    }
    setToken(t);
    const jwt = parseJwt(t);
    console.log('Decoded access token:', jwt);
    let sub = jwt && (jwt.patient || jwt.sub);
    if (!sub) {
      setError("No patient context found in access token.");
      return;
    }
    // Try to resolve the real FHIR Patient ID using /Patient?identifier=<sub>
    async function resolvePatientId() {
      try {
        const url = `${FHIR_BASE_URL}Patient?identifier=${sub}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${t}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        if (data.entry && data.entry.length > 0 && data.entry[0].resource && data.entry[0].resource.id) {
          // setPatientId(data.entry[0].resource.id); // This line is removed
        } else {
          // Fallback to sub if no match found
          // setPatientId(sub); // This line is removed
        }
      } catch {
        // setPatientId(sub); // This line is removed
      }
    }
    resolvePatientId();
  }, []);

  useEffect(() => {
    if (!token || !patientId) return;
    async function fetchPatient() {
      try {
        const res = await fetch(`${FHIR_BASE_URL}Patient/${patientId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!res.ok) {
          const errorBody = await res.text();
          console.error('Patient fetch failed:', res.status, errorBody);
          setError(`Failed to fetch patient demographics (HTTP ${res.status})`);
          return;
        }
        const data = await res.json();
        setPatient(data);
      } catch (err: any) {
        setError("Failed to fetch patient demographics");
        console.error('Patient fetch error:', err);
      }
    }
    fetchPatient();
  }, [token, patientId]);

  useEffect(() => {
    if (!token || !patientId) return;
    async function fetchMedications() {
      try {
        const medUrl = `${FHIR_BASE_URL}MedicationRequest?patient=${patientId}`;
        const res = await fetch(medUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        setMedications(data.entry ? data.entry.map((e: any) => e.resource) : []);
      } catch (err: any) {
        setError("Failed to fetch medications");
      }
    }
    async function fetchLabs() {
      try {
        const labUrl = `${FHIR_BASE_URL}DiagnosticReport?patient=${patientId}`;
        const res = await fetch(labUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        setLabs(data.entry ? data.entry.map((e: any) => e.resource) : []);
      } catch (err: any) {
        setError("Failed to fetch lab reports");
      }
    }
    async function fetchVitals() {
      try {
        const vitalsUrl = `${FHIR_BASE_URL}Observation?patient=${patientId}&category=vital-signs`;
        const res = await fetch(vitalsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        setVitals(data.entry ? data.entry.map((e: any) => e.resource) : []);
      } catch (err: any) {
        setError("Failed to fetch vital signs");
      }
    }
    fetchMedications();
    fetchLabs();
    fetchVitals();
  }, [token, patientId]);

  function renderTabContent() {
    if (activeTab === "medications") {
      return medications.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-4">
          <ul className="list-disc pl-5 text-gray-900">
            {medications.map((med, idx) => {
              let medName = med.medicationCodeableConcept?.text;
              if (!medName && med.medicationReference?.display) {
                medName = med.medicationReference.display;
              }
              if (!medName && med.medicationReference?.reference) {
                medName = med.medicationReference.reference;
              }
              const dosage = med.dosageInstruction && med.dosageInstruction.length > 0
                ? med.dosageInstruction.map((d: any) => d.text).filter(Boolean).join('; ')
                : null;
              if (!medName && !dosage) return null;
              return (
                <li key={med.id || idx} className="mb-3">
                  <span className="font-semibold text-blue-800">
                    {medName || "Unknown Medication"}
                  </span>
                  {med.authoredOn && <span className="ml-2 text-gray-700">(Prescribed: {med.authoredOn})</span>}
                  {med.status && <span className="ml-2 text-gray-600">- Status: {med.status}</span>}
                  {dosage && (
                    <div className="text-gray-700 text-base mt-1 ml-2">{dosage}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 text-gray-900">
          <p>No medications found.</p>
        </div>
      );
    }
    if (activeTab === "labs") {
      return labs.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-4">
          <ul className="list-disc pl-5 text-gray-900">
            {labs.map((lab, idx) => {
              const labName = lab.code?.text;
              const date = lab.effectiveDateTime;
              const status = lab.status;
              if (!labName && !date && !status) return null;
              return (
                <li key={lab.id || idx} className="mb-3">
                  <span className="font-semibold text-blue-800">
                    {labName || (date || status ? "Lab Report" : null)}
                  </span>
                  {date && <span className="ml-2 text-gray-700">(Date: {date})</span>}
                  {status && <span className="ml-2 text-gray-600">- Status: {status}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 text-gray-900">
          <p>No lab reports found.</p>
        </div>
      );
    }
    if (activeTab === "vitals") {
      return vitals.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-4">
          <ul className="list-disc pl-5 text-gray-900">
            {vitals.map((vital, idx) => {
              const vitalName = vital.code?.text;
              const date = vital.effectiveDateTime;
              const value = vital.valueQuantity ? `${vital.valueQuantity.value} ${vital.valueQuantity.unit}` : null;
              // Blood pressure: LOINC 85354-9
              let bpDisplay = null;
              if (vital.code?.coding?.some((c: any) => c.code === '85354-9')) {
                // Find systolic (8480-6) and diastolic (8462-4) in components
                const systolic = vital.component?.find((comp: any) => comp.code?.coding?.some((c: any) => c.code === '8480-6'));
                const diastolic = vital.component?.find((comp: any) => comp.code?.coding?.some((c: any) => c.code === '8462-4'));
                if (systolic && diastolic) {
                  bpDisplay = `Systolic: ${systolic.valueQuantity.value} ${systolic.valueQuantity.unit}, Diastolic: ${diastolic.valueQuantity.value} ${diastolic.valueQuantity.unit}`;
                }
              }
              if (!vitalName && !date && !value && !bpDisplay) return null;
              return (
                <li key={vital.id || idx} className="mb-3">
                  <span className="font-semibold text-blue-800">
                    {vitalName || (date || value || bpDisplay ? "Vital Sign" : null)}
                  </span>
                  {date && <span className="ml-2 text-gray-700">(Date: {date})</span>}
                  {bpDisplay && <span className="ml-2 text-gray-600">{bpDisplay}</span>}
                  {!bpDisplay && value && <span className="ml-2 text-gray-600">: {value}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 text-gray-900">
          <p>No vital signs found.</p>
        </div>
      );
    }
    return null;
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_response");
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-200">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-2xl flex flex-col items-center border-t-8 border-blue-400 relative">
        <button
          onClick={handleLogout}
          className="absolute top-6 right-8 text-sm font-semibold text-teal-700 bg-teal-100 border border-teal-300 rounded-full px-4 py-1 shadow hover:bg-teal-200 transition-all"
        >
          Log out
        </button>
        <h1 className="text-4xl font-extrabold mb-6 text-blue-700 tracking-tight">Patient Dashboard</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <section className="w-full mb-8">
          {patient ? (
            <div className="bg-white rounded-lg shadow p-8 mb-6 w-full flex flex-col items-center">
              <h2 className="text-3xl font-extrabold mb-2 text-blue-800 text-center tracking-tight">
                {patient.name?.[0]?.given?.join(" ")} {patient.name?.[0]?.family}
              </h2>
              <div className="w-16 border-b-2 border-blue-200 mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-4 w-full max-w-xl text-lg">
                <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                  <span className="inline-block text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 7v-7m0 0l-9-5m9 5l9-5" /></svg>
                  </span>
                  <span className="font-semibold text-gray-700">Gender:</span>
                  <span className="text-gray-900 font-medium text-lg">{patient.gender}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                  <span className="inline-block text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  <span className="font-semibold text-gray-700">Date of Birth:</span>
                  <span className="text-gray-900 font-medium text-lg">{patient.birthDate}</span>
                </div>
                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 min-w-0 whitespace-nowrap">
                  <span className="inline-block text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2 .896 2 2 2 2-.896 2-2zm0 0c0 1.104.896 2 2 2s2-.896 2-2-.896-2-2-2-2 .896-2 2zm0 0v2m0 4h.01" /></svg>
                  </span>
                  <span className="font-semibold text-gray-700">FHIR identifier:</span>
                  <span className="text-gray-900 font-medium text-lg">{patient.identifier?.[0]?.value}</span>
                </div>
              </div>
            </div>
          ) : (
            <p>Loading patient info...</p>
          )}
        </section>
        <nav className="mb-6 flex gap-4 border-b-4 border-blue-200 w-full justify-center bg-gradient-to-r from-blue-100 to-teal-100 rounded-t-lg">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`py-2 px-6 font-bold border-b-4 transition-colors focus:outline-none rounded-t-lg ${activeTab === tab.key ? "border-blue-600 text-blue-700 bg-blue-50" : "border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-100"}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <section className="w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-b-lg shadow-inner p-6 min-h-[180px]">
          {renderTabContent()}
        </section>
      </div>
    </div>
  );
} 