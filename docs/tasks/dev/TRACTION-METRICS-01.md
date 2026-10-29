# Traction P5 — samtyckesstyrd grundmätning

Bas `knowledge/d3-catalog-delivery@9cdaf92`. Målet är en användbar, begränsad funnel och D1/D7 för dem som uttryckligen väljer mätning. Befintligt samtycke är av från början, kan återkallas och raderar då kontoägarnas händelser. Inga personliga attribut, kodvärden, hunddata eller innehålls-ID skickas. Föranmälda länkar används av onboarding som förut; mätning sker tidigast efter bekräftat samtycke och tidstämplas då, aldrig retroaktivt.

- Frivilligt val under första profilskapandet: tydlig information om 30 dagar och att valet kan ändras. En felaktig eller oklar sparning får inte visas som aktiverad och får inte blockera skapandet.
- Onboarding-händelse vid första uppmätta öppning efter samtycke. QR-/referral-händelsen betyder att en säker djuplänksreferens fanns då, inte att en anonym QR-skanning registrerades. Hundskapande, Hem och första nytta använder bekräftade befintliga event.
- En service-role-begränsad aggregerad rapport visar mätbara, samtyckande kohorter och D1/D7 i rullande 24-timmarsfönster. Fullständigt mogna kohorter väljs inom 30-dagarslagringen; små grupper under fem döljs. Ingen klientåtkomst till rådata eller rapport.
- Verifiera faktisk SQL lokalt för samtycke/återkallande, tillåtna event, avvisade roller, period och aggregering. Verifiera appens tomt/fel/sparat-läge i syntetisk RN Web. Live-databas och TestFlight kvarstår som separata kontroller.
