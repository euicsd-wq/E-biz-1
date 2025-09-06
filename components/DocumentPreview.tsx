import React from 'react';
import type { DocumentSettings, CompanyProfile } from '../types';
import { getContrastingTextColor } from '../utils';

type DocumentPreviewProps = {
  settings: DocumentSettings;
  companyProfile: CompanyProfile;
};

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ settings, companyProfile }) => {
    const headerTextColor = getContrastingTextColor(settings.accentColor);
    
    const marginMap = {
        small: 'p-4',
        medium: 'p-8',
        large: 'p-12'
    };
    
    const logoSizeMap = {
        small: 'h-16 w-16',
        medium: 'h-20 w-20',
        large: 'h-24 w-24'
    };

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg">
             <h3 className="text-lg font-semibold text-white mb-4 text-center">Live Preview</h3>
            <div className="bg-white rounded shadow-lg overflow-hidden">
                <div 
                    className={`${marginMap[settings.pageMargin]}`}
                    style={{ fontFamily: settings.fontFamily, color: settings.textColor, fontSize: `${settings.fontSize}pt` }}
                >
                    {/* Header */}
                    <header className={`flex items-start pb-2 mb-4 ${settings.logoPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`} style={{ borderBottom: `2px solid ${settings.accentColor}`}}>
                        <div className={`flex-shrink-0 ${settings.logoPosition === 'left' ? 'mr-4' : 'ml-4'}`}>
                            {settings.showLogo && companyProfile.logo ? (
                                <img src={companyProfile.logo} alt="Logo" className={`${logoSizeMap[settings.logoSize]} object-contain`} />
                            ) : settings.showLogo ? (
                                <div className={`${logoSizeMap[settings.logoSize]} flex items-center justify-center border`} style={{ borderColor: settings.accentColor }}>
                                    <span className="font-bold text-2xl" style={{ color: settings.accentColor }}>LOGO</span>
                                </div>
                            ) : null}
                        </div>
                        <div className="flex-grow">
                            <h1 className="font-bold" style={{ color: settings.accentColor, fontSize: `${settings.fontSize + 4}pt` }}>{companyProfile.name}</h1>
                            <p className="whitespace-pre-line" style={{ fontSize: `${settings.fontSize - 1}pt` }}>{companyProfile.address}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <h2 className="font-bold tracking-wider" style={{ color: settings.accentColor, fontSize: `${settings.fontSize + 12}pt` }}>QUOTE</h2>
                        </div>
                    </header>

                    {/* Body */}
                     <div className="flex justify-between my-4 text-sm">
                        <div className="w-[48%]">
                            <h3 className="font-bold mb-1">BILL TO:</h3>
                            <p className="font-semibold">Sample Client Inc.</p>
                            <p>123 Business Rd, Suite 456</p>
                            <p>Commerce City, 78910</p>
                        </div>
                    </div>
                    
                    {/* Table */}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 w-[50%]" style={{ backgroundColor: settings.accentColor, color: headerTextColor, border: `1px solid ${settings.tableTheme === 'grid' ? settings.secondaryColor : settings.accentColor}` }}>Item</th>
                                <th className="p-2" style={{ backgroundColor: settings.accentColor, color: headerTextColor, border: `1px solid ${settings.tableTheme === 'grid' ? settings.secondaryColor : settings.accentColor}` }}>Qty</th>
                                <th className="p-2" style={{ backgroundColor: settings.accentColor, color: headerTextColor, border: `1px solid ${settings.tableTheme === 'grid' ? settings.secondaryColor : settings.accentColor}` }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ backgroundColor: settings.tableTheme === 'striped' ? settings.secondaryColor : 'transparent' }}>
                                <td className="p-2" style={{ border: `1px solid ${settings.tableTheme !== 'plain' ? settings.secondaryColor : 'transparent'}` }}>Premium Widget</td>
                                <td className="p-2" style={{ border: `1px solid ${settings.tableTheme !== 'plain' ? settings.secondaryColor : 'transparent'}` }}>2</td>
                                <td className="p-2" style={{ border: `1px solid ${settings.tableTheme !== 'plain' ? settings.secondaryColor : 'transparent'}` }}>$200.00</td>
                            </tr>
                             <tr>
                                <td className="p-2" style={{ border: `1px solid ${settings.tableTheme !== 'plain' ? settings.secondaryColor : 'transparent'}` }}>Standard Service</td>
                                <td className="p-2" style={{ border: `1px solid ${settings.tableTheme !== 'plain' ? settings.secondaryColor : 'transparent'}` }}>1</td>
                                <td className="p-2" style={{ border: `1px solid ${settings.tableTheme !== 'plain' ? settings.secondaryColor : 'transparent'}` }}>$50.00</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Footer */}
                     <footer className="mt-auto pt-4 text-center" style={{ borderTop: `1px solid ${settings.accentColor}`, fontSize: `${settings.fontSize - 2}pt` }}>
                         <p>{settings.footerText}</p>
                         {settings.showPageNumbers && <p>Page 1 of 1</p>}
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default DocumentPreview;