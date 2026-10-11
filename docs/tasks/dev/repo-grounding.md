# REPO-GROUNDING — SDK-teamets repo-underlag

## Uppdrag och databeslut

Erik bad om att tillämpa `tassla-repo-grounding.patch` så att `tassla_team` kan besvara frågor med projektunderlag. Erik godkände uttryckligen att avgränsade utdrag ur repo-dokument skickas till den konfigurerade OpenAI-modellen och uppgav därefter: ”Jag har gjort en egen bedömning (Erik) så det är bara att köra”. Detta dokument återger ägarens uppgift; det är inte en oberoende juridisk verifiering av kontovillkor.

Underlaget är rådgivande och endast Markdown-utdrag från en fast `docs/`-allowlist plus statuskön. Appkod, `.env`, `.git`, integritetsdokument, intervjufil, beta-kontofil och angivna rapport-/ägarfeedbackfiler ingår inte. E-post, telefonnummer och svenska postadresser maskeras. Agenterna får inga fil- eller shellverktyg. Användaren kan stänga av utdrag med `--no-repo`.

## Plan v2

1. Lägg till lokal, skrivskyddad och begränsad repo-kontext i varje SDK-teambrief; stöd `--no-repo`.
2. Inkludera MVP:ns `Måste med`- och `Utanför MVP`-utdrag, uppgiftsstatus och relevanta sektioner; följdfrågor får använda föregående användarfråga för task-ID-matchning.
3. Begränsa status-, task-, sektion- och totalstorlek; maskera kontaktuppgifter/postadresser och uteslut känsliga dokument.
4. Behandla all repo-text som opålitlig källdata i samtliga SDK-roller.
5. Uppdatera `docs/ai-team.md` med dataväg, allowlist-/undantagsgränser och begränsningar.

Berörda filer: `run_team.py`, `tassla_team/chief_of_staff.py`, `tassla_team/organisation.py`, `tassla_team/repo_context.py`, `docs/ai-team.md`, `work/check_repo_context.py`.

## Granskning

- Architect: APPROVE för plan v2 efter komplettering av scopeutdrag, följdfrågor och storleksgränser.
- Critic: PROCEED när scope, integritetsminimering, totalgräns, följdfrågor, prompt-injection-regel och dokumentation införs.
- Architect: APPROVE av implementeringen efter att ofullständigt scope markerats och kombinerad payload begränsats.
- Critic: PROCEED med angivna implementeringsgrindar; dessa infördes.
- Security: PASS på slutdiffen, inklusive delad truncering, maskering, allowlist/undantag och instruktion till router och roller.
- Compliance: minimeringsplanen bedömdes tillräcklig om den genomförs. Ägaren uppgav därefter att egen bedömning är gjord; oberoende juridisk verifiering av OpenAI-kontots villkor har inte utförts här.

## Status

Patchen är applicerad och rättningarna i plan v2 är införda. Slutdiffen granskades; Security PASS och Architect APPROVE. `work/check_repo_context.py` uppdaterades men kördes inte. Inga tester eller API-körningar har körts i denna uppgift. Kvarstående begränsning: kontovillkor för lagring, behandling och överföring har inte verifierats oberoende.
