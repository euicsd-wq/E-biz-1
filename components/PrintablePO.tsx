import React, { forwardRef } from 'react';
import type { WatchlistItem, CompanyProfile, PurchaseOrder, Vendor } from '../types';
import { EmpireUnitedLogo } from './icons';
import { formatCurrency, formatTenderDate } from '../utils';

type PrintablePOProps = {
  tender: WatchlistItem;
  po: PurchaseOrder;
  companyProfile: CompanyProfile;
  vendor: Vendor | undefined;
};

const PrintablePO = forwardRef<HTMLDivElement, PrintablePOProps>(({ tender, po, companyProfile, vendor }, ref) => {
    const total = po.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  return (
    <div ref={ref} style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Inter, sans-serif' }} className="p-10 bg-white text-black text-xs flex flex-col font-sans">
        <header className="flex justify-between items-start pb-4 border-b-2 border-black">
             <div className="flex items-center">
                {companyProfile.logo ? (
                  <img src={companyProfile.logo} alt="Company Logo" className="h-20 w-20 object-contain mr-4" />
                ) : (
                  <EmpireUnitedLogo className="h-20 w-20 mr-4" />
                )}
                <div>
                    <h1 className="text-xl font-bold text-black">{companyProfile.name}</h1>
                    <p className="text-black text-[10px]">{companyProfile.address}</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-bold text-black tracking-wider">PURCHASE ORDER</h2>
            </div>
        </header>
        
        <section className="grid grid-cols-2 gap-8 my-8">
            <div>
                <p className="font-bold text-black text-sm mb-1">VENDOR:</p>
                {vendor ? (
                    <div className="text-black">
                        <p className="font-semibold">{vendor.name}</p>
                        <p>{vendor.address}</p>
                        <p>{vendor.email}</p>
                        <p>{vendor.phone}</p>
                    </div>
                ) : <p>N/A</p>}
            </div>
            <div className="text-sm">
                 <div className="flex justify-between"><span className="font-bold text-black">P.O. Number:</span><span>{po.poNumber}</span></div>
                 <div className="flex justify-between"><span className="font-bold text-black">Date:</span><span>{formatTenderDate(po.issueDate)}</span></div>
                 <div className="flex justify-between"><span className="font-bold text-black">Project Ref:</span><span className="truncate max-w-[150px]" title={tender.tender.title}>{tender.tender.title}</span></div>
            </div>
        </section>

        <section className="flex-grow">
            <table className="w-full text-left text-sm">
                <thead className="bg-black text-white">
                    <tr>
                        <th className="p-2 font-semibold w-[50%]">Description</th>
                        <th className="p-2 font-semibold text-center w-[15%]">Qty</th>
                        <th className="p-2 font-semibold text-right w-[15%]">Unit Price</th>
                        <th className="p-2 font-semibold text-right w-[20%]">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {po.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-200">
                            <td className="p-2 text-black align-top">
                                {item.description}
                                {item.hsnCode && <div className="text-xs text-gray-500">HSN: {item.hsnCode}</div>}
                            </td>
                            <td className="p-2 text-center text-black align-top">{item.quantity}</td>
                            <td className="p-2 text-right text-black align-top">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2 text-right font-medium text-black align-top">{formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                    ))}
                </tbody>
                 <tfoot className="font-bold">
                    <tr>
                        <td colSpan={3} className="p-2 text-right text-black">Subtotal</td>
                        <td className="p-2 text-right text-black">{formatCurrency(total)}</td>
                    </tr>
                     <tr>
                        <td colSpan={3} className="p-2 text-right text-black border-t-2 border-black">TOTAL</td>
                        <td className="p-2 text-right text-black border-t-2 border-black">{formatCurrency(total)}</td>
                    </tr>
                </tfoot>
            </table>
        </section>
        
        <footer className="mt-auto pt-4 border-t border-black text-center text-black text-[9px]">
             <p>{companyProfile.name} | {companyProfile.address} | {companyProfile.phone}</p>
        </footer>
    </div>
  );
});

export default PrintablePO;