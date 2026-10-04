# Tasslas AI-organisation

```text
Du – slutliga beslut
├── AI Chief of Staff – samordnar Product och Commercial
│   ├── Head of Product
│   │   ├── Growth & Distribution
│   │   └── Customer/Product Critic
│   └── Commercial Lead
│       ├── Partnerships
│       ├── Market Intelligence
│       └── Commercial Analyst
└── Erik – leder Dev och äger tekniska beslut
    └── AI Tech Lead
        ├── Codex implementation
        └── QA
```

Chief of Staff kan inhämta tekniskt underlag via AI Tech Lead, men är inte Eriks chef och fattar inte tekniska beslut.

## Filer och åtkomst
`run_team.py` är den nya ingången. `tassla_team/chief_of_staff.py` sköter urval och körningar. `tassla_team/organisation.py` innehåller team, rapporteringsvägar och rollernas instruktioner.

Alla SDK-roller är rådgivande. Inga externa meddelande-, webb-, fil- eller shellverktyg finns. Market Intelligence arbetar med tillhandahållet underlag och markerar aktuella fakta utan källor som obekräftade. SDK-rollen Codex implementation är en rådgivare; verklig utveckling sker i Codex under Erik. QA får inte hävda att tester har körts.

Codex-definitionerna i `.codex/agents/` är separata från SDK-agenterna. Vilande Dev-definitioner ligger i `.codex/agents-later/`, original i `.codex/archive/original-agents/`. Hundgranskning och compliance finns kvar som Codex-stöd vid behov och ersätts inte av Commercial.

## Selektivt urval och kostnadsgränser
Chief of Staff väljer normalt ett relevant team, högst två per fråga. Varje team får noll till två relevanta specialister; ledaren kan svara utan specialister. Programmet avvisar okända roller, roller i fel team och dubbletter innan specialistkörning. Endast valda roller anropas; modellerna får inga verktyg för att starta fler agenter.

Hälsningar och enkla klargöranden kan besvaras direkt. Product hanterar användarnytta och distribution; Commercial partneravtal, marknad och ekonomi; Dev teknik och verifiering. Critic används för granskning av substantiella produktförslag, inte automatiskt för varje fråga. Den semantiska relevansen avgörs av modellen och behöver utvärderas lokalt; den är ingen matematisk garanti.

Varje körning har högst ett modellsteg. En fråga använder 1–9 API-anrop: urval, högst fyra specialister, högst två teamledare och Chief of Staffs sammanvägning, samt ett Product-utkast när Critic väljs. Critic granskar utkastet före Products slutliga sammanvägning; STOP läses ur ett strukturerat verdict-fält. Varje steg har en outputgräns. Ett Critic-STOP avbryter fortsatt sammanvägning och lämnas till människan. Tokenanvändning och valda roller visas.

## Kör så här
- En fråga: `python run_team.py "Behöver uppfödare bonus för att dela Tassla via QR-kod?"`
- Samtalsläge: `python run_team.py --chat`
- I samtalsläge: `/reset` tömmer minnet, `/quit` avslutar.

Minne hålls bara i processen: högst två tidigare frågor och slutliga svar, maximalt 2400 tecken skickas vidare. Det försvinner när programmet avslutas och inkluderar inte hela interna agentdiskussionen. Varje ny fråga kostar API-tokens. Frågor är begränsade till 1500 tecken. Standardmodell `gpt-4.1-nano`, ändringsbar med `TASSLA_TEST_MODEL`. Tracing är avstängd.

`test_agent.py` finns kvar som separat fast Product/Growth-test; `--critic` där innebär avsiktligt en fast granskningskedja. Använd `run_team.py` för selektivt urval.

## Lokal utvärdering
Testa produktprioritering, partnerersättning och QA var för sig. Kontrollera att rätt team valts och att irrelevanta specialister inte anropats. Syntax och urvalsgränser kan verifieras utan API. Faktisk modellrouting har inte körts av Codex; inga betalda API-anrop har gjorts i implementationen.

## Projektunderlag och modellöversikt
`python run_team.py --roles` visar alla SDK- och Codex-roller med modell och reasoning-inställning utan API-anrop. SDK använder fortfarande samma `TASSLA_TEST_MODEL` för alla roller. Reasoning är inte explicit konfigurerat där; gpt-4.1-nano har ingen low/medium/high-inställning. Codex-definitionerna har individuella modell- och reasoning-inställningar.

`python run_team.py --chat --project-context` skickar begränsade utdrag ur `docs/vision.md`, `docs/mvp.md` och `docs/revenue.md`. Läsning är endast tillåten för dessa fasta filer; `.env`, `.git` och övriga filer exponeras inte. Utdragen är högst 2000 tecken per dokument, alltså inte fullständig projektkunskap. Underlagets godkännandestatus antas inte. Först senare bör relevanta avsnitt väljas per roll; denna enkla version skickar samma begränsade basunderlag till de valda rollerna och ökar tokenkostnaden.

Större arbeten delas upp enligt `docs/tasks/template.md` och AGENTS.md, med högst två samtidiga deluppgifter och sparade checkpoints. Detta förfarande garanterar inte att en avbruten körning automatiskt återstartas.

## Codex-utvecklarflöde 2026-10-04
Dev-definitionerna är nu tillgängliga i `.codex/agents/`, inte vilande. Implementation, QA och reviewer använder GPT-6 Luna high; Tech Lead och Security behåller sina granskningsmodeller. Faktisk appimplementation kräver fortfarande godkänt segment och plan. Se `docs/dev/workflow.md` och `tools/dev_flow.py`. SDK-teamets modellinställning är oförändrad och ger bara råd. Ingen nattlig automation har skapats.
