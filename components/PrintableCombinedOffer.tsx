
import React, { forwardRef } from 'react';
import type { WatchlistItem, CompanyProfile, Client, DocumentSettings } from '../types';
import PrintableQuote from './PrintableQuote';
import PrintableTechnicalOffer from './PrintableTechnicalOffer';

type PrintableCombinedOfferProps = {
  tender: WatchlistItem;
  companyProfile: CompanyProfile;
  clients: Client[];
  settings: DocumentSettings;
};

const PrintableCombinedOffer = forwardRef<HTMLDivElement, PrintableCombinedOfferProps>(({ tender, companyProfile, clients, settings }, ref) => {
  return (
    <div ref={ref}>
      <PrintableQuote tender={tender} companyProfile={companyProfile} clients={clients} settings={settings} />
      {(tender.quoteItems && tender.quoteItems.length > 0) &&
        <PrintableTechnicalOffer tender={tender} companyProfile={companyProfile} settings={settings} />
      }
    </div>
  );
});

export default PrintableCombinedOffer;
