import React, { forwardRef, useMemo } from 'react';
import type { WatchlistItem, QuoteItem, CompanyProfile, DocumentSettings } from '../types';

type PrintableTechnicalOfferProps = {
  tender: WatchlistItem;
  companyProfile: CompanyProfile;
  settings: DocumentSettings;
};

const DEFAULT_TECHNICAL_DETAILS_FIELDS: { id: string; label: string; }[] = [
    { id: 'manufacturerName', label: 'I. Manufacturer Name' },
    { id: 'modelNo', label: 'II. Model No.' },
    { id: 'countryOfOrigin', label: 'III. Country of Origin' },
    { id: 'descriptionOfFunction', label: '1. Description of Function' },
    { id: 'operationalRequirements', label: '2. Operational Requirements' },
    { id: 'systemConfiguration', label: '3. System Configuration' },
    { id: 'technicalSpecifications', label: '4. Technical Specifications' },
    { id: 'accessoriesSparesConsumables', label: '5. Accessories, Spares, and Consumables' },
    { id: 'operatingEnvironment', label: '6. Operating Environment' },
    { id: 'standardsSafetyRequirements', label: '7. Standards and Safety Requirements' },
    { id: 'userTraining', label: '8. User Training' },
    { id: 'warranty', label: '9. Warranty' },
    { id: 'maintenanceService', label: '10. Maintenance Service During Warranty Period' },
    { id: 'installationCommissioning', label: '11. Installation and Commissioning' },
    { id: 'documentation', label: '12. Documentation' },
];

const TechnicalOfferTable: React.FC<{ item: QuoteItem, sopFields: {id: string, label: string}[], settings: DocumentSettings }> = ({ item, sopFields, settings }) => (
    <div className="mb-8" style={{ breakInside: 'avoid' }}>
        <h3 className="text-lg font-bold mb-2 pb-1 text-black" style={{ borderBottom: `2px solid ${settings.accentColor}`, color: settings.accentColor }}>Item: {item.itemName}</h3>
        <p className="text-xs italic mb-2">{item.description}</p>
        <table className="w-full border-collapse text-sm">
            <tbody>
                {sopFields.map((field, index) => (
                    <tr key={field.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="border border-gray-400 p-2 font-semibold text-black w-1/3 align-top">{field.label}</td>
                        <td className="border border-gray-400 p-2 whitespace-pre-wrap text-black">{item.technicalDetails?.[field.id] || ''}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const PrintableTechnicalOffer = forwardRef<HTMLDivElement, PrintableTechnicalOfferProps>(({ tender, companyProfile, settings }, ref) => {
    const { quoteItems, technicalOfferSOP } = tender;
    
    const hasCustomSOP = technicalOfferSOP && technicalOfferSOP.length > 0;

    const sopFields = useMemo(() => {
        if (hasCustomSOP) {
            return technicalOfferSOP!.map(line => ({ id: line, label: line }));
        }
        return DEFAULT_TECHNICAL_DETAILS_FIELDS;
    }, [hasCustomSOP, technicalOfferSOP]);

  return (
    <div ref={ref} style={{ width: '210mm', fontFamily: settings.fontFamily }} className="p-10 bg-white text-black text-xs flex flex-col font-sans printable-page">
        <header className="flex justify-between items-start pb-4" style={{ borderBottom: `2px solid ${settings.accentColor}` }}>
             <div className="flex items-center">
                {settings.showLogo && companyProfile.logo ? (
                  <img src={companyProfile.logo} alt="Company Logo" className="h-20 w-20 object-contain mr-4" />
                ) : settings.showLogo ? (
                  <div className="w-20 h-20 mr-4 flex items-center justify-center border" style={{ borderColor: settings.accentColor }}>
                      <span className="font-bold text-2xl" style={{ color: settings.accentColor }}>LOGO</span>
                  </div>
                ) : null}
                <div>
                    <h1 className="text-xl font-bold" style={{ color: settings.accentColor }}>{companyProfile.name}</h1>
                    <p className="text-[10px]">{companyProfile.address}</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-bold tracking-wider" style={{ color: settings.accentColor }}>Technical Offer</h2>
            </div>
        </header>
        
        <main className="flex-grow py-8">
            {quoteItems && quoteItems.length > 0 ? (
                quoteItems.map(item => <TechnicalOfferTable key={item.id} item={item} sopFields={sopFields} settings={settings} />)
            ) : (
                <p className="text-center py-20">No items in the financial quote to generate a technical offer for.</p>
            )}
        </main>

        <footer className="mt-auto pt-4 text-center text-[9px]" style={{ borderTop: `1px solid ${settings.accentColor}` }}>
             <p>{companyProfile.name} | {companyProfile.address} | {companyProfile.phone}</p>
        </footer>
         <style>{`
            .printable-page {
                page-break-before: always;
            }
        `}</style>
    </div>
  );
});

export default PrintableTechnicalOffer;
