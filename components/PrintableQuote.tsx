import React, { forwardRef } from 'react';
import type { WatchlistItem, CompanyProfile, Client, DocumentSettings } from '../types';
import { getContrastingTextColor } from '../utils';

type PrintableQuoteProps = {
  tender: WatchlistItem;
  companyProfile: CompanyProfile;
  clients: Client[];
  settings: DocumentSettings;
};

const PrintableQuote = forwardRef<HTMLDivElement, PrintableQuoteProps>(({ tender, companyProfile, clients, settings }, ref) => {
    const { financialDetails, quoteItems } = tender;
    const subtotal = quoteItems?.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) ?? 0;
    const delivery = financialDetails?.deliveryCost ?? 0;
    const installation = financialDetails?.installationCost ?? 0;
    const vat = subtotal * ((financialDetails?.vatPercentage ?? 0) / 100);
    const total = subtotal + delivery + installation + vat;

    const client = clients.find(c => c.id === financialDetails?.clientId);
    const headerTextColor = getContrastingTextColor(settings.accentColor);

  return (
    <div ref={ref} style={{ width: '210mm', minHeight: '297mm', fontFamily: settings.fontFamily }} className="p-10 bg-white text-black text-[10px] flex flex-col font-sans">
        <style>{`
          .printable-table th { background-color: ${settings.accentColor}; color: ${headerTextColor}; border: 1px solid ${settings.accentColor}; }
          .printable-table td { border: 1px solid #ccc; }
          .section-title { font-weight: bold; border-bottom: 1px solid ${settings.accentColor}; padding-bottom: 2px; margin-bottom: 4px; color: ${settings.accentColor}; }
        `}</style>
        {/* Header */}
        <header className="flex justify-between items-start pb-4" style={{ borderBottom: `2px solid ${settings.accentColor}`}}>
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
                    <p className="text-[9px] whitespace-pre-line">{companyProfile.address}</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-5xl font-bold tracking-wider" style={{ color: settings.accentColor }}>QUOTE</h2>
                <p className="mt-2">Quote #: {financialDetails?.quoteNumber}</p>
                <p>Date: {financialDetails?.issueDate ? new Date(financialDetails.issueDate + 'T00:00:00').toLocaleDateString() : ''}</p>
            </div>
        </header>
        
        {/* Client & Ship Info */}
        <section className="flex justify-between my-6 text-[9px]">
            <div className="w-[48%] p-2 border" style={{ borderColor: settings.accentColor }}>
                <h3 className="font-bold mb-1">BILL TO:</h3>
                <p className="font-semibold">{client?.name || financialDetails?.shipToName || 'N/A'}</p>
                <p className="whitespace-pre-line">{client?.address || financialDetails?.shipToAddress || ''}</p>
                <p>{client?.email || financialDetails?.shipToEmail || ''}</p>
                <p>{client?.phone || financialDetails?.shipToPhone || ''}</p>
            </div>
            <div className="w-[48%] p-2 border" style={{ borderColor: settings.accentColor }}>
                <h3 className="font-bold mb-1">SHIP TO:</h3>
                <p className="font-semibold">{financialDetails?.shipToName || client?.name || 'N/A'}</p>
                <p className="whitespace-pre-line">{financialDetails?.shipToAddress || client?.address || ''}</p>
                 <p>{financialDetails?.shipToEmail || client?.email || ''}</p>
                <p>{financialDetails?.shipToPhone || client?.phone || ''}</p>
            </div>
        </section>

        {/* Items Table & Totals */}
        <section className="flex-grow">
            <table className="w-full text-left border-collapse printable-table text-[9px]">
                <thead>
                    <tr>
                        <th className="p-1 w-[5%] text-center">#</th>
                        <th className="p-1 w-[20%]">Item</th>
                        <th className="p-1 w-[35%]">Description</th>
                        <th className="p-1 w-[8%] text-center">Qty</th>
                        <th className="p-1 w-[8%] text-center">UoM</th>
                        <th className="p-1 w-[12%] text-right">Unit Price</th>
                        <th className="p-1 w-[12%] text-right">Total Price</th>
                    </tr>
                </thead>
                <tbody>
                    {quoteItems && quoteItems.length > 0 ? (
                        quoteItems.map((item, index) => (
                            <tr key={item.id}>
                                <td className="p-1 text-center align-top">{index + 1}</td>
                                <td className="p-1 align-top font-semibold">
                                  {item.itemName}
                                  {item.hsnCode && <div className="text-[8px] font-normal text-gray-600">HSN: {item.hsnCode}</div>}
                                </td>
                                <td className="p-1 align-top whitespace-pre-wrap">{item.description}</td>
                                <td className="p-1 text-center align-top">{item.quantity}</td>
                                <td className="p-1 text-center align-top">{item.uom || '-'}</td>
                                <td className="p-1 text-right align-top">${item.unitPrice.toFixed(2)}</td>
                                <td className="p-1 text-right font-semibold align-top">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                            </tr>
                        ))
                    ) : (
                         <tr><td colSpan={7} className="p-4 text-center h-20">No items in quote.</td></tr>
                    )}
                </tbody>
            </table>

            {/* Totals */}
            {quoteItems && quoteItems.length > 0 && (
              <div className="flex justify-end mt-1">
                  <div className="w-1/2">
                       <table className="w-full text-left text-[9px]">
                          <tbody>
                              <tr><td className="p-1">Subtotal</td><td className="p-1 text-right">${subtotal.toFixed(2)}</td></tr>
                              <tr><td className="p-1">Delivery</td><td className="p-1 text-right">${delivery.toFixed(2)}</td></tr>
                              <tr><td className="p-1">Installation</td><td className="p-1 text-right">${installation.toFixed(2)}</td></tr>
                              <tr><td className="p-1">VAT ({financialDetails?.vatPercentage ?? 0}%)</td><td className="p-1 text-right">${vat.toFixed(2)}</td></tr>
                              <tr style={{ backgroundColor: settings.accentColor, color: headerTextColor }} className="font-bold">
                                <td className="p-1">TOTAL</td>
                                <td className="p-1 text-right">${total.toFixed(2)}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
            )}
        </section>
        
        {/* Terms */}
        <section className="mt-6 space-y-4 text-[9px]">
            {financialDetails?.deliveryTerms && <div><h4 className="section-title">DELIVERY</h4><p className="whitespace-pre-wrap">{financialDetails.deliveryTerms}</p></div>}
            {financialDetails?.validity && <div><h4 className="section-title">VALIDITY</h4><p className="whitespace-pre-wrap">{financialDetails.validity}</p></div>}
            {financialDetails?.installationAndTraining && <div><h4 className="section-title">INSTALLATION AND TRAINING</h4><p className="whitespace-pre-wrap">{financialDetails.installationAndTraining}</p></div>}
            {financialDetails?.paymentMethod && <div><h4 className="section-title">PAYMENT TERMS</h4><p className="whitespace-pre-wrap">{financialDetails.paymentMethod}</p></div>}
            {financialDetails?.termsAndConditions && <div><h4 className="section-title">TERMS AND CONDITIONS</h4><p className="whitespace-pre-wrap">{financialDetails.termsAndConditions}</p></div>}
            {financialDetails?.remarks && <div><h4 className="section-title">REMARKS</h4><p className="whitespace-pre-wrap">{financialDetails.remarks}</p></div>}
        </section>
        
        <footer className="mt-auto pt-4 text-center text-[8px]" style={{ borderTop: `1px solid ${settings.accentColor}` }}>
             <p>Thank you for your business!</p>
             <p>{companyProfile.name} | {companyProfile.phone} | {companyProfile.email}</p>
        </footer>
    </div>
  );
});

export default PrintableQuote;
