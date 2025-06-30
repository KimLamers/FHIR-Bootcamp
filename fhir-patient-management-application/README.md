# FHIR-Bootcamp---Patient-Management-Application

## Specs:

- List the patients on a FHIR server displaying:
  - name
  - gender
  - date of birth
- Create patients by submitting a form with the patient's name, gender, date of birth and phone number
  - requires validation
- Allow update of all patients who are on the FHIR server by opening them on the same form and updating details
- Search patients by their name or phone number


# 🩺 FHIR Patient Manager

A simple React application to view, create, edit, and search FHIR patients using the public [HAPI FHIR R4 server](https://hapi.fhir.org/). It demonstrates real-time interaction with FHIR resources using modern React and clean UI components.

---

## ✨ Features

- ✅ Display list of patients
- 🔍 Search by **name** or **phone number**
- ➕ Create new patients with validation
- ✏️ Edit existing patients
- 📡 Real-time API interaction (HAPI FHIR server)
- 💄 Simple and responsive interface

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

---

### 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/fhir-patient-manager.git
cd fhir-patient-manager


## Install dependencies

npm install
# or
yarn

##Start the development server

npm start
# or
yarn start

Then open http://localhost:3000 in your browser.


## 🗂️ Project Structure

src/
│
├── components/
│   ├── PatientForm.js        # Form to create/edit a patient
│   ├── PatientTable.js       # Table to display patient list
│   └── SearchBar.js          # Search input and logic
│
├── utils/
│   └── patientApi.js         # API fetch helpers
│
├── styles/
│   └── styles.js             # UI styles for reuse
│
└── App.js                    # Main app file


## 🔍 Search Support
The search bar allows filtering patients by name or phone number. It queries the HAPI FHIR API on submit. Results are merged client-side and deduplicated.

## 📡 FHIR API Endpoints Used
- GET /Patient?_count=20
- GET /Patient?name=...
- GET /Patient?telecom=...
- POST /Patient
- PUT /Patient/{id}

ℹ️ This project uses the public HAPI FHIR R4 server, which may periodically reset its data.

## ✅ Form Validation Rules
Name:
- Required
- At least 2 characters
- Must not contain numbers or special characters other than spaces, apostrophes, or hyphens

Gender:
- Must be one of: male, female, other, unknown

Birth Date:
- Required
- Cannot be a future date

Phone:

- Required
- Must be a valid number format (digits, spaces, dashes, parentheses, +)