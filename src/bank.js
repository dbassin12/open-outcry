/* Open Outcry: AP Macro Unit 1 round bank.
   Every answer for the News Desk and Double Shock rounds is computed from `shifts`,
   so the key can never drift from the graph. Option numbers match hand signals (1-4). */

var OO_BANK = {

  /* ---------- NEWS DESK: one curve shifts ----------
     shift.c: "D" or "S"; shift.d: +1 (right/increase) or -1 (left/decrease) */
  news: [
    { id: "coffee", level: "easy", ticker: "KC", market: "Coffee", price: 2.40, per: "lb",
      headline: "Frost destroys a third of Brazil's coffee crop",
      shift: { c: "S", d: -1 }, shifter: "Weather and natural disasters",
      why: "The frost hits coffee growers, so this is a supply story. Growers have fewer beans to sell at every price, so supply shifts left. Price rises and quantity falls.",
      hint: "Did the frost change what buyers want, or what sellers can bring to market?" },

    { id: "sneakers", level: "easy", ticker: "SNKR", market: "Sneakers", price: 120, per: "pair",
      headline: "A star player wears a new sneaker in the playoffs and the shoe goes viral",
      shift: { c: "D", d: 1 }, shifter: "Tastes and preferences",
      why: "Buyers suddenly want this sneaker more, so this is a demand story. Demand shifts right. Price and quantity both rise.",
      hint: "Who changed here, buyers or sellers?" },

    { id: "ev", level: "easy", ticker: "EV", market: "Electric cars", price: 42000, per: "car",
      headline: "New battery technology cuts the cost of building an electric car",
      shift: { c: "S", d: 1 }, shifter: "Technology",
      why: "Better technology makes each car cheaper to build, so sellers offer more cars at every price. Supply shifts right. Price falls and quantity rises.",
      hint: "Cheaper to make. Does that change buyers or sellers?" },

    { id: "movies", level: "easy", ticker: "TIX", market: "Movie theater tickets", price: 14, per: "ticket",
      headline: "Streaming services cut their monthly price in half",
      shift: { c: "D", d: -1 }, shifter: "Price of a substitute",
      why: "Streaming is a substitute for going to the movies. When the substitute gets cheaper, fewer people want theater tickets at every price. Demand shifts left. Price and quantity both fall.",
      hint: "Streaming and movie theaters: used together, or used instead of each other?" },

    { id: "rent", level: "easy", ticker: "RENT", market: "Apartments in a college town", price: 1800, per: "month",
      headline: "A new university opens and brings 10,000 students to town",
      shift: { c: "D", d: 1 }, shifter: "Number of buyers",
      why: "More students means more people looking for apartments. Demand shifts right. Rent and the number of apartments rented both rise.",
      hint: "The new students need a place to live. Are they buyers or sellers?" },

    { id: "tacos", level: "easy", ticker: "TACO", market: "Tacos downtown", price: 4, per: "taco",
      headline: "Twenty new food trucks start selling tacos downtown",
      shift: { c: "S", d: 1 }, shifter: "Number of sellers",
      why: "More food trucks means more tacos for sale at every price. Supply shifts right. Price falls and quantity rises.",
      hint: "Food trucks are sellers." },

    { id: "sofas", level: "easy", ticker: "SOFA", market: "Sofas", price: 900, per: "sofa",
      headline: "Wages for furniture factory workers jump 25 percent",
      shift: { c: "S", d: -1 }, shifter: "Input prices (the cost of labor)",
      why: "Workers are an input. When labor costs more, firms make fewer sofas at every price. Supply shifts left. Price rises and quantity falls.",
      hint: "Wages are a cost for which side of the market?" },

    { id: "energy", level: "easy", ticker: "NRG", market: "Energy drinks", price: 3, per: "can",
      headline: "A major health study links energy drinks to heart problems",
      shift: { c: "D", d: -1 }, shifter: "Tastes and preferences",
      why: "After the study, buyers want energy drinks less at every price. Demand shifts left. Price and quantity both fall.",
      hint: "Who reads the study and changes their mind?" },

    { id: "ramen", level: "hard", ticker: "RAMN", market: "Instant ramen (an inferior good)", price: 0.50, per: "pack",
      headline: "Incomes rise across the country",
      shift: { c: "D", d: -1 }, shifter: "Income (inferior good)",
      why: "For most people, instant ramen is an inferior good. When people earn more, they switch to food they like better. Demand shifts left. Price and quantity both fall.",
      hint: "Do people buy MORE or LESS instant ramen after they get a raise?" },

    { id: "buns", level: "hard", ticker: "BUNS", market: "Hot dog buns", price: 3, per: "pack",
      headline: "The price of hot dogs doubles",
      shift: { c: "D", d: -1 }, shifter: "Price of a complement",
      why: "Hot dogs and buns are complements. They are used together. When hot dogs cost more, people buy fewer hot dogs and need fewer buns. Demand for buns shifts left. Price and quantity of buns both fall.",
      hint: "This is the market for BUNS, not hot dogs." },

    { id: "consoles", level: "hard", ticker: "GAME", market: "Video game consoles", price: 500, per: "console",
      headline: "The price of video games (not consoles) drops by half",
      shift: { c: "D", d: 1 }, shifter: "Price of a complement",
      why: "Games and consoles are complements. Cheaper games make owning a console more attractive. Demand for consoles shifts right. Price and quantity of consoles both rise.",
      hint: "This is the market for CONSOLES. Games and consoles go together." },

    { id: "gas", level: "hard", ticker: "RB", market: "Gasoline", price: 3.50, per: "gallon",
      headline: "Drivers hear gas will cost $1 more per gallon next week and rush to fill up today",
      shift: { c: "D", d: 1 }, shifter: "Buyers' expectations",
      why: "Drivers expect a higher price later, so they fill up today. Today's demand shifts right. Today's price and quantity both rise.",
      hint: "What do drivers do TODAY when they expect a higher price next week?" },

    { id: "corn", level: "hard", ticker: "ZC", market: "Corn", price: 4.50, per: "bushel",
      headline: "Soybean prices soar, so farmers switch fields from corn to soybeans",
      shift: { c: "S", d: -1 }, shifter: "Prices of related goods (another crop the farmer could grow)",
      why: "Soybeans now pay more, so farmers use their land for soybeans instead of corn. Less corn is offered at every price. The supply of corn shifts left. Price rises and quantity falls.",
      hint: "Farmers are the sellers. What happens to how much corn they grow?" },

    { id: "solar", level: "hard", ticker: "SOLR", market: "Solar panels", price: 300, per: "panel",
      headline: "The government pays solar panel makers $50 for every panel they produce",
      shift: { c: "S", d: 1 }, shifter: "Government subsidy",
      why: "A subsidy lowers the cost of making each panel, so makers offer more panels at every price. Supply shifts right. Price falls and quantity rises.",
      hint: "Who receives the $50, buyers or makers?" },

    { id: "wheat", level: "hard", ticker: "ZW", market: "Wheat (this year)", price: 6, per: "bushel",
      headline: "Wheat farmers expect prices to be much higher next year, so they store part of this year's crop",
      shift: { c: "S", d: -1 }, shifter: "Sellers' expectations",
      why: "Farmers hold wheat back to sell later at a higher price. Less wheat is offered today at every price. Today's supply shifts left. Price rises and quantity falls.",
      hint: "Storing wheat means less wheat for sale right now." },

    { id: "choc", level: "hard", ticker: "CHOC", market: "Chocolate bars", price: 2, per: "bar",
      headline: "The price of cocoa beans falls sharply",
      shift: { c: "S", d: 1 }, shifter: "Input prices",
      why: "Cocoa beans are an input for chocolate makers. Cheaper inputs mean makers offer more bars at every price. Supply shifts right. Price falls and quantity rises.",
      hint: "Who buys cocoa beans: chocolate eaters or chocolate makers?" },

    { id: "soda", level: "hard", ticker: "SODA", market: "Soda", price: 2, per: "bottle",
      headline: "The city charges soda companies a $1 tax on every bottle they sell",
      shift: { c: "S", d: -1 }, shifter: "Taxes on sellers",
      why: "The tax raises the cost of selling each bottle. Sellers offer less soda at every price. Supply shifts left. Price rises and quantity falls.",
      hint: "Who pays the tax to the city?" }
  ],

  /* ---------- DOUBLE SHOCK: both curves shift ---------- */
  double: [
    { id: "avocados", ticker: "AVO", market: "Avocados", price: 1.50, per: "avocado",
      headlines: ["Avocado toast takes over social media", "A drought shrinks Mexico's avocado harvest"],
      shifts: [{ c: "D", d: 1 }, { c: "S", d: -1 }],
      why: "Demand rises (more people want avocados) and supply falls (a smaller harvest). Both shifts push the price UP, so price rises for sure. Quantity is pushed up by demand and down by supply, so it depends on which shift is bigger. Quantity is indeterminate." },

    { id: "laptops", ticker: "LPTP", market: "Laptops", price: 700, per: "laptop",
      headlines: ["New chip technology cuts the cost of making laptops", "Every high school now requires students to bring a laptop"],
      shifts: [{ c: "S", d: 1 }, { c: "D", d: 1 }],
      why: "Supply rises (cheaper to make) and demand rises (more buyers). Both shifts push quantity UP, so quantity rises for sure. Price is pushed down by supply and up by demand, so price is indeterminate." },

    { id: "spinners", ticker: "SPIN", market: "Fidget spinners", price: 5, per: "spinner",
      headlines: ["The fidget spinner fad is over", "Dozens of new factories start making fidget spinners"],
      shifts: [{ c: "D", d: -1 }, { c: "S", d: 1 }],
      why: "Demand falls (the fad is over) and supply rises (more factories). Both shifts push the price DOWN, so price falls for sure. Quantity is pushed down by demand and up by supply, so quantity is indeterminate." },

    { id: "icecream", ticker: "CONE", market: "Ice cream", price: 5, per: "pint",
      headlines: ["The coldest summer in 50 years", "Milk and sugar prices soar"],
      shifts: [{ c: "D", d: -1 }, { c: "S", d: -1 }],
      why: "Demand falls (cold weather) and supply falls (milk and sugar are inputs that got more expensive). Both shifts push quantity DOWN, so quantity falls for sure. Price is pushed down by demand and up by supply, so price is indeterminate." },

    { id: "oj", ticker: "OJ", market: "Orange juice", price: 4, per: "half gallon",
      headlines: ["A breakfast trend has everyone drinking orange juice", "A hurricane wipes out orange groves in Florida"],
      shifts: [{ c: "D", d: 1 }, { c: "S", d: -1 }],
      why: "Demand rises (the trend) and supply falls (fewer oranges). Both shifts push the price UP, so price rises for sure. Quantity is pushed up by demand and down by supply, so quantity is indeterminate." },

    { id: "ebikes", ticker: "EBK", market: "E-bikes", price: 1500, per: "bike",
      headlines: ["Cities build hundreds of miles of new bike lanes", "A giant new e-bike factory opens"],
      shifts: [{ c: "D", d: 1 }, { c: "S", d: 1 }],
      why: "Demand rises (bike lanes make e-bikes more useful) and supply rises (a big new factory). Both shifts push quantity UP, so quantity rises for sure. Price is pushed up by demand and down by supply, so price is indeterminate." }
  ],

  /* ---------- FLASH ROUND: shift of the curve or slide along it ---------- */
  /* dir: for SHIFT, +1 = curve moves right, -1 = left. For SLIDE, +1 = the good's price rises, -1 = it falls. */
  flash: [
    { id: "f1", market: "Pizza", text: "Pizza prices fall, so you buy more pizza", answer: "SLIDE", curve: "D", dir: -1,
      why: "Pizza's own price changed. You slide along the demand curve. That is a change in quantity demanded." },
    { id: "f2", market: "Pizza", text: "Burger prices fall, so you buy less pizza", answer: "SHIFT", curve: "D", dir: -1,
      why: "A substitute's price changed, not pizza's. The whole demand curve for pizza shifts left." },
    { id: "f3", market: "Bread", text: "A new oven lets a bakery bake twice as much bread every hour", answer: "SHIFT", curve: "S", dir: 1,
      why: "Better technology. The whole supply curve for bread shifts right." },
    { id: "f4", market: "Bread", text: "Bread prices rise, so bakeries bake more bread", answer: "SLIDE", curve: "S", dir: 1,
      why: "Bread's own price changed. Bakeries slide along the supply curve. That is a change in quantity supplied." },
    { id: "f5", market: "Steak", text: "You get a raise, so you buy more steak", answer: "SHIFT", curve: "D", dir: 1,
      why: "Your income changed. For a normal good like steak, the demand curve shifts right." },
    { id: "f6", market: "Sneakers", text: "A store cuts sneaker prices 30 percent and sales jump", answer: "SLIDE", curve: "D", dir: -1,
      why: "The sneakers' own price fell. Buyers slide along the demand curve. That is a change in quantity demanded." },
    { id: "f7", market: "Phones", text: "Shoppers expect phone prices to rise next month, so they buy now", answer: "SHIFT", curve: "D", dir: 1,
      why: "Buyers' expectations changed. Today's demand curve shifts right." },
    { id: "f8", market: "Oil", text: "Oil prices rise, so oil companies pump more oil", answer: "SLIDE", curve: "S", dir: 1,
      why: "Oil's own price changed. Companies slide along the supply curve. That is a change in quantity supplied." },
    { id: "f9", market: "Candy", text: "A new tax on candy companies raises their costs", answer: "SHIFT", curve: "S", dir: -1,
      why: "A tax on sellers. The whole supply curve for candy shifts left." },
    { id: "f10", market: "Concert tickets", text: "Ticket prices go up, so fewer fans buy tickets", answer: "SLIDE", curve: "D", dir: 1,
      why: "The tickets' own price changed. Fans slide along the demand curve. That is a change in quantity demanded." },
    { id: "f11", market: "Umbrellas", text: "A week of rain is in the forecast, so umbrella sales jump", answer: "SHIFT", curve: "D", dir: 1,
      why: "The cause is the rain forecast, not the price of umbrellas. Buyers want more umbrellas at every price, so the demand curve shifts right." },
    { id: "f12", market: "Lemonade", text: "Lemons get cheaper, so lemonade stands make more lemonade", answer: "SHIFT", curve: "S", dir: 1,
      why: "An input got cheaper. The whole supply curve for lemonade shifts right." }
  ],

  /* ---------- ECONOMY DESK: scarcity, opportunity cost, the PPC ---------- */
  economy: [
    { id: "recession", visual: "ppc-points",
      headline: "A recession hits. Factories sit idle and millions of workers lose their jobs.",
      prompt: "Where is the economy now?",
      options: ["Point 1", "Point 2", "Point 3", "Point 4"], answer: 3,
      why: "Point 3 is inside the curve. Workers and factories are sitting unused, so the economy makes less than it could. Inside the curve means unemployed resources. That is inefficient.",
      hint: "Unused workers means the economy makes less than it could." },

    { id: "outside", visual: "ppc-points",
      headline: "The country's leaders want to produce at Point 4.",
      prompt: "What would let the country produce at Point 4?",
      options: ["Make fewer cars and more wheat", "Put unemployed workers back to work", "Nothing. Point 4 can never be reached.", "More resources or better technology"], answer: 4,
      why: "Point 4 is outside the curve, so it is unattainable today. Economic growth (more resources, more capital, better technology) shifts the whole curve out until Point 4 is on it. Hiring unemployed workers only moves the economy from inside the curve up to the curve.",
      hint: "Moving to the curve is not the same as moving the curve." },

    { id: "robot", visual: "ppc-choice",
      headline: "A new robot cuts the time it takes to build a car in half. Wheat farming does not change.",
      prompt: "Which graph shows the new PPC?",
      options: ["Only the car end moves out", "Only the wheat end moves out", "Both ends move out", "The whole curve moves in"],
      graphs: ["pivotX", "pivotY", "out", "in"], answer: 1,
      why: "Only car making got better. If the country makes all cars, it can now make more than before, so the car end moves out. If it makes all wheat, nothing changed, so the wheat end stays put.",
      hint: "Which good got the new technology?" },

    { id: "table", visual: "ppc-table",
      headline: "The country moves from Combination C to Combination D.",
      prompt: "What is the opportunity cost of the extra 10 tons of wheat?",
      table: { labels: ["A", "B", "C", "D", "E"], wheat: [0, 10, 20, 30, 40], cars: [100, 90, 70, 40, 0] },
      from: 2, to: 3,
      options: ["10 cars", "20 cars", "30 cars", "40 cars"], answer: 3,
      why: "At C the country makes 70 cars. At D it makes 40 cars. It gives up 30 cars to get 10 more tons of wheat. Each extra 10 tons costs more cars than the last (10, then 20, then 30, then 40). That is increasing opportunity cost, and it is why the PPC bows out.",
      hint: "Only look at the CARS column for C and D." },

    { id: "straight", visual: "ppc-straight",
      headline: "Bakeville's PPC for bread and cake is a straight line.",
      prompt: "What does the straight line tell you?",
      options: ["Opportunity cost stays the same", "Opportunity cost keeps rising", "There is no opportunity cost", "The economy is wasting resources"], answer: 1,
      why: "A straight line has the same slope everywhere, so each extra cake always costs the same amount of bread. That happens when resources are equally good at making both goods. A curve that bows out means rising opportunity cost.",
      hint: "Think about the slope." },

    { id: "capital", visual: "ppc-capital",
      headline: "Two countries start with the same PPC. Alpha puts more into capital goods (factories, machines, tools). Beta puts more into consumer goods (food, clothes, phones).",
      prompt: "Whose PPC will probably grow more in the future?",
      options: ["They will grow the same", "Alpha", "Beta", "Neither PPC can grow"], answer: 2,
      why: "Capital goods are tools used to make other goods. More capital today means more production tomorrow, so Alpha's PPC should shift out farther. Beta enjoys more goods now but grows less later.",
      hint: "Which goods help you make MORE goods later?" },

    { id: "nextbest", visual: "choices",
      headline: "You have one free hour tonight. You can study for the econ test, play basketball, or sleep. You pick basketball. Studying was your second choice.",
      prompt: "What is your opportunity cost?",
      choices: ["Basketball", "Studying", "Sleep"], picked: 0, nextBest: 1,
      options: ["Nothing. It was free time.", "The hour of basketball", "Studying AND sleeping", "The hour of studying"], answer: 4,
      why: "Opportunity cost is the value of your next best alternative, the best thing you gave up. You can only use the hour once, so your opportunity cost is studying, not studying plus sleeping.",
      hint: "Opportunity cost is ONE thing: the next best choice." },

    { id: "beyond", visual: "ppc-trade",
      headline: "After trading with another country, Avalon's people have the goods shown at the star, outside Avalon's own PPC.",
      prompt: "How is that possible?",
      options: ["It isn't. Points outside the PPC are impossible.", "Avalon put unemployed workers back to work.", "Avalon specialized and traded.", "Avalon made fewer bikes and more phones."], answer: 3,
      why: "A country cannot PRODUCE outside its PPC on its own. But when it specializes in the good it makes at a lower opportunity cost than its partner (its comparative advantage) and trades, it can CONSUME outside its PPC. That extra is the gain from trade.",
      hint: "Producing and consuming are not the same thing." }
  ],

  /* ---------- TRADE DESK: comparative advantage and terms of trade ----------
     Output problems: numbers are how much one worker makes in a day (or what a country makes with all its resources).
     Each set has a "who makes what" round and a "set the price" round with the same two countries. */
  tradeSets: [
    { id: "setA", kind: "output",
      countries: ["Atlantis", "Avalon"], goods: ["Phones", "Bikes"], unitNote: "Output of one worker in one day",
      units: [["phone", "phones"], ["bike", "bikes"]],
      data: [[15, 5], [4, 4]],
      specialize: {
        id: "atlantis-who",
        headline: "Atlantis and Avalon want to trade phones and bikes.",
        prompt: "Who should make what?",
        options: ["Atlantis makes both. It is better at everything.", "Atlantis makes bikes. Avalon makes phones.", "Atlantis makes phones. Avalon makes bikes.", "No trade. Avalon has nothing to offer."], answer: 3,
        why: "Atlantis makes more of both goods (absolute advantage), but trade follows opportunity cost. A phone costs Atlantis only 1/3 of a bike (5 ÷ 15) but costs Avalon 1 bike (4 ÷ 4), so Atlantis makes phones. A bike costs Avalon 1 phone but costs Atlantis 3 phones (15 ÷ 5), so Avalon makes bikes.",
        hint: "Being better at both is absolute advantage. Trade follows what each country GIVES UP." },
      terms: {
        id: "atlantis-deal",
        headline: "Avalon will make bikes. Atlantis will pay for them with phones.",
        prompt: "Which deal makes BOTH countries better off?",
        options: ["1 bike for ½ phone", "1 bike for 2 phones", "1 bike for 3 phones", "1 bike for 4 phones"],
        values: [0.5, 2, 3, 4], answer: 2,
        zone: { low: 1, lowWho: "Avalon", high: 3, highWho: "Atlantis", unit: "phones per bike", max: 5 },
        why: "Making a bike costs Avalon 1 phone, so Avalon needs MORE than 1 phone per bike. Making a bike costs Atlantis 3 phones, so Atlantis will pay LESS than 3. Any price between 1 and 3 phones helps both, so 2 phones works. At exactly 3, Atlantis gains nothing.",
        hint: "Find what a bike costs EACH country to make. The deal must land between those two numbers." }
    },
    { id: "setB", kind: "output",
      countries: ["Coralia", "Pinewood"], goods: ["Fish (tons)", "Rice (tons)"], unitNote: "What each country makes in a year using all its resources",
      units: [["ton of fish", "tons of fish"], ["ton of rice", "tons of rice"]],
      data: [[60, 30], [20, 20]],
      specialize: {
        id: "coralia-who",
        headline: "Coralia and Pinewood want to trade fish and rice.",
        prompt: "Who has the comparative advantage in RICE?",
        options: ["Pinewood, because 1 ton of rice costs it only 1 ton of fish", "Coralia, because it grows more rice (30 vs. 20)", "Coralia, because 1 ton of rice costs it only ½ ton of fish", "Neither. Coralia is better at both."], answer: 1,
        why: "Coralia makes more of both (absolute advantage), but that is not the test. For 1 ton of rice, Coralia gives up 2 tons of fish (60 ÷ 30). Pinewood gives up only 1 ton of fish (20 ÷ 20). Lower opportunity cost means Pinewood has the comparative advantage in rice.",
        hint: "Comparative advantage = the LOWER opportunity cost." },
      terms: {
        id: "coralia-deal",
        headline: "Pinewood will grow rice. Coralia will pay for it with fish.",
        prompt: "Which deal makes BOTH countries better off?",
        options: ["1 ton of rice for ½ ton of fish", "1 ton of rice for 1 ton of fish", "1 ton of rice for 1½ tons of fish", "1 ton of rice for 3 tons of fish"],
        values: [0.5, 1, 1.5, 3], answer: 3,
        zone: { low: 1, lowWho: "Pinewood", high: 2, highWho: "Coralia", unit: "tons of fish per ton of rice", max: 3.5 },
        why: "Rice costs Pinewood 1 ton of fish to grow, so Pinewood needs MORE than 1 ton of fish per ton of rice. Rice costs Coralia 2 tons of fish, so Coralia will pay LESS than 2. Only 1½ tons falls between 1 and 2. At exactly 1, Pinewood gains nothing.",
        hint: "Find what a ton of rice costs EACH country. The deal must land between those two numbers." }
    }
  ],

  /* Input problems: numbers are HOURS to make ONE unit (smaller is better). */
  tradeInput: [
    { id: "upland", kind: "input",
      countries: ["Upland", "Lowland"], goods: ["Sweaters", "Boots (pairs)"], unitNote: "Hours needed to make ONE",
      units: [["sweater", "sweaters"], ["pair of boots", "pairs of boots"]],
      data: [[2, 4], [6, 8]],
      headline: "Upland and Lowland can trade sweaters and boots.",
      prompt: "Who should specialize in BOOTS?",
      options: ["Upland, because it makes boots in less time (4 hours vs. 8)", "Neither. Upland is faster at both goods, so there is no gain from trade.", "Upland, because a pair of boots costs it only ½ sweater", "Lowland, because a pair of boots costs it only 1⅓ sweaters"], answer: 4,
      why: "With hours, smaller is better, so Upland is faster at both goods (absolute advantage). For opportunity cost, ask: in the time it takes to make one pair of boots, how many sweaters could you make? Upland: 4 ÷ 2 = 2 sweaters. Lowland: 8 ÷ 6 = 1⅓ sweaters. Lowland gives up less, so Lowland has the comparative advantage in boots.",
      hint: "How many sweaters could each country make in the time it takes to make one pair of boots?" },

    { id: "redport", kind: "input",
      countries: ["Redport", "Bluebay"], goods: ["Chairs", "Tables"], unitNote: "Hours needed to make ONE",
      units: [["chair", "chairs"], ["table", "tables"]],
      data: [[3, 6], [2, 8]],
      headline: "Redport and Bluebay can trade chairs and tables.",
      prompt: "Who should make what?",
      options: ["Redport makes tables. Bluebay makes chairs.", "Bluebay makes tables. Redport makes chairs.", "Bluebay makes both. It is faster at chairs.", "No trade. Each is faster at one good."], answer: 1,
      why: "In the 6 hours Redport needs for a table, it could make 2 chairs. In the 8 hours Bluebay needs for a table, it could make 4 chairs. A table costs Redport less, so Redport makes tables. A chair costs Bluebay only ¼ of a table (2 ÷ 8) and costs Redport ½ of a table (3 ÷ 6), so Bluebay makes chairs.",
      hint: "In the time it takes to make one table, how many chairs could each country make?" }
  ],

  /* ---------- INVENTORY CHECK: shortage and surplus ---------- */
  schedules: {
    jerseys: { market: "Team jerseys", ticker: "JRSY", unit: "jerseys",
      prices: [20, 40, 60, 80, 100], qd: [1000, 800, 600, 400, 200], qs: [200, 400, 600, 800, 1000] },
    pizza: { market: "Pizza slices at the school fundraiser", ticker: "SLCE", unit: "slices",
      prices: [1, 2, 3, 4, 5], qd: [500, 400, 300, 200, 100], qs: [100, 200, 300, 400, 500] }
  },

  inventory: [
    { id: "jersey40", schedule: "jerseys", setPrice: 40,
      headline: "The team store prices jerseys at $40.",
      prompt: "What happens at $40?",
      options: ["A surplus of 400 jerseys", "A shortage of 400 jerseys", "A shortage of 800 jerseys", "Nothing. The market clears."], answer: 2,
      why: "At $40, fans want 800 jerseys but sellers offer only 400. Quantity demanded is greater than quantity supplied, so there is a shortage of 800 − 400 = 400 jerseys. The price is below equilibrium ($60), so it tends to rise.",
      hint: "Compare quantity demanded and quantity supplied in the $40 row." },

    { id: "jersey100", schedule: "jerseys", setPrice: 100,
      headline: "The team store prices jerseys at $100.",
      prompt: "What happens at $100?",
      options: ["A surplus of 1,000 jerseys", "A shortage of 800 jerseys", "A surplus of 200 jerseys", "A surplus of 800 jerseys"], answer: 4,
      why: "At $100, sellers offer 1,000 jerseys but fans want only 200. Quantity supplied is greater than quantity demanded, so there is a surplus of 1,000 − 200 = 800 jerseys. The price is above equilibrium ($60), so it tends to fall.",
      hint: "Surplus or shortage = the gap between the two quantities." },

    { id: "pizza4", schedule: "pizza", setPrice: 4,
      headline: "The student council sets the price at $4 a slice.",
      prompt: "What happens at $4?",
      options: ["A shortage of 200 slices", "Equilibrium. 300 slices sell.", "A surplus of 200 slices", "A surplus of 400 slices"], answer: 3,
      why: "At $4, 400 slices are offered but students want only 200. Quantity supplied is greater than quantity demanded, so there is a surplus of 400 − 200 = 200 slices. The price is above equilibrium ($3), so it tends to fall.",
      hint: "Find the $4 row. Which quantity is bigger?" },

    { id: "jersey80", schedule: "jerseys", setPrice: 80,
      headline: "The team store prices jerseys at $80.",
      prompt: "What happens next?",
      options: ["A surplus, so the price falls", "A shortage, so the price rises", "A surplus, so the price rises", "A shortage, so the price falls"], answer: 1,
      why: "At $80, sellers offer 800 jerseys but fans want only 400. That is a surplus of 400. Sellers cut the price to sell the extra jerseys, so the price falls toward $60.",
      hint: "Extra jerseys on the shelf. What do sellers do?" }
  ],

  /* ---------- MARKET EVENTS ---------- */
  events: {
    bull:     { name: "Bull market",    text: "Right calls pay double this round." },
    risky:    { name: "Risky business", text: "Wins and losses are both doubled this round." },
    insider:  { name: "Insider tip",    text: "One wrong answer is crossed out for everyone." },
    underdog: { name: "Underdog rally", text: "If the last-place team makes the right call, it wins triple." }
  }
};
