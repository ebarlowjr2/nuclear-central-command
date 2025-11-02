# Nuclear Command Center

A public dashboard for global nuclear reactors, country stats, and educational content.

## Overview

Nuclear Command Center is a comprehensive web application that provides real-time tracking and visualization of nuclear reactors worldwide. The platform offers interactive maps, detailed reactor information, country comparisons, and educational resources about nuclear energy.

## Features

- **Global Dashboard**: View key statistics including total reactors, global capacity, operating rates, and reactors under construction
- **Interactive Map**: Explore nuclear reactors worldwide with an interactive map showing locations and details
- **Reactor Directory**: Browse and filter reactors by status, type, country, and capacity
- **Reactor Details**: View comprehensive information about individual reactors including technical specifications, timeline, and generation data
- **Country Explorer**: Browse nuclear energy statistics by country
- **Country Comparison**: Compare nuclear energy statistics between two countries
- **Educational Resources**: Learn about nuclear energy through facts, glossary, and explanations organized by category
- **ETL Integration**: Automated data ingestion from EIA, NRC, and support for PRIS CSV uploads

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **Maps**: Leaflet, React-Leaflet
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **ETL**: Vercel Cron Jobs

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- (Optional) EIA API key for energy data
- (Optional) Mapbox token for enhanced maps

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ebarlowjr2/nuclear-central-command.git
cd nuclear-central-command
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
EIA_API_KEY=your_eia_api_key
MAPBOX_TOKEN=your_mapbox_token
```

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the SQL to create all tables and indexes

5. Load sample data (recommended for testing):
   - In the Supabase SQL Editor, copy and paste the contents of `seed-data.sql`
   - Execute the SQL to populate the database with realistic sample data
   - This includes 10 countries, 19 reactors, generation data, country stats, and educational facts
   - You can skip this step if you plan to use the ETL routes to fetch real data

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
nuclear-central-command/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── reactors/         # Reactor endpoints
│   │   ├── countries/        # Country endpoints
│   │   ├── stats/            # Statistics endpoints
│   │   ├── etl/              # ETL job endpoints
│   │   └── alerts/           # Alert subscription endpoints
│   ├── reactors/             # Reactor pages
│   ├── map/                  # Map page
│   ├── countries/            # Country pages
│   ├── learn/                # Educational content page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── TopNav.tsx            # Navigation bar
│   ├── StatsCards.tsx        # KPI cards
│   ├── ReactorCard.tsx       # Reactor card component
│   ├── FilterPanel.tsx       # Filter sidebar
│   ├── TrendsChart.tsx       # Chart component
│   ├── WorldMap.tsx          # Leaflet map component
│   └── FactCard.tsx          # Educational fact card
├── lib/                      # Utility functions
│   ├── utils.ts              # Helper utilities
│   └── supabaseServer.ts     # Supabase server client
├── types.ts                  # TypeScript type definitions
├── supabase-schema.sql       # Database schema
├── seed-data.sql             # Sample data for testing
└── README.md                 # This file
```

## API Endpoints

### Reactors
- `GET /api/reactors/list?status=Operating&country=US&type=PWR&limit=50&offset=0` - List reactors with filters
- `GET /api/reactors/[id]` - Get reactor details with generation data and status history

### Countries
- `GET /api/countries/list` - List all countries with reactor counts
- `GET /api/countries/compare?ids=ID1,ID2` - Compare two countries

### Statistics
- `GET /api/stats/global` - Global reactor statistics
- `GET /api/stats/trends?country=US&metric=nuclear_twh` - Country trends over time
- `GET /api/stats/top?metric=capacity&scope=country&limit=10` - Top countries or reactors

### ETL Jobs
- `GET /api/etl/eia` - Fetch data from EIA API
- `GET /api/etl/nrc` - Fetch data from NRC
- `POST /api/etl/pris-upload` - Upload PRIS CSV data

### Alerts
- `POST /api/alerts` - Subscribe to reactor alerts

## ETL & Data Ingestion

The application supports automated data ingestion through:

1. **EIA API**: US nuclear generation and energy mix data
2. **NRC**: US reactor status, coordinates, and metadata
3. **PRIS CSV Upload**: Manual upload of IAEA PRIS data

### Setting up Vercel Cron Jobs

In your Vercel project settings, configure cron jobs:

1. Navigate to Settings → Cron Jobs
2. Add the following jobs:
   - `0 2 * * *` → `https://your-project.vercel.app/api/etl/nrc` (Daily at 2 AM)
   - `0 3 * * 1` → `https://your-project.vercel.app/api/etl/eia` (Weekly Monday at 3 AM)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel project settings
4. Deploy

The application will be automatically deployed on every push to the main branch.

## Data Sources

- **EIA (Energy Information Administration)**: US energy statistics
- **NRC (Nuclear Regulatory Commission)**: US reactor data
- **IAEA PRIS (Power Reactor Information System)**: Global reactor database
- **World Nuclear Association**: Industry statistics and reports

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with Next.js and Supabase
- UI components from shadcn/ui
- Map data from OpenStreetMap
- Nuclear data from EIA, NRC, and IAEA PRIS

## Support

For questions or issues, please open an issue on GitHub or contact the maintainers.

---

**Link to Devin run**: https://app.devin.ai/sessions/1c164f72ac8549d7803c5de3fd2895a4

**Created by**: Eddie Barlow Jr (eddiebarlowjr@gmail.com)
