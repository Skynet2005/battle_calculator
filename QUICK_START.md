# Quick Start Guide: Battle Simulation System

## 🚀 Getting Started

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to Battle Setup
Open your browser and go to: **`http://localhost:3000/battle/setup`**

### 3. Test the Integration

#### Option A: Use Profile Integration Bridge (Recommended for Testing)
1. Scroll to the "Integration Test: Profile → API" section
2. Click **"Load Current Profile"** button
3. Review any validation warnings
4. Click **"Simulate Battle"** button
5. View results in the panel below

#### Option B: Use the New Form (Future)
1. Fill out the form sections (currently placeholders)
2. Click **"Simulate Battle"** button
3. View results

## 📋 What's Working

✅ **API Endpoints**
- `POST /api/battles/simulate` - Battle simulation
- `GET /api/joiners` - Joiner search/autocomplete

✅ **Routes**
- `/battle/setup` - Main setup page
- `/battle/history` - View past simulations
- `/battle/runs/[id]` - View individual simulation details

✅ **Features**
- Profile loading and validation
- Battle simulation with caching
- Results visualization (summary, metrics, timeline, rationale)
- Draft persistence (auto-saves to localStorage)
- Rate limiting (10 requests/minute)
- Timeline virtualization for large battles

## 🔍 Testing Checklist

- [ ] Page loads without errors
- [ ] Profile loads successfully
- [ ] Profile validation works
- [ ] Simulation API responds
- [ ] Results display correctly
- [ ] Timeline scrolls smoothly
- [ ] Inflection points are clickable
- [ ] Metrics show correct values

## 🐛 Troubleshooting

### Profile Won't Load
- Ensure you're logged in
- Check browser console for errors
- Verify profiles exist in database

### Simulation Fails
- Check browser console for detailed error
- Verify profile has valid rally configuration
- Ensure troop counts are > 0
- Check network tab for API response

### Results Don't Display
- Check that API returned valid response
- Verify viewModel structure
- Check browser console for React errors

## 📚 Next Steps

1. **Full Form Integration**: Integrate PlayerTab/OpponentTab/RallyTab components
2. **Joiner Configuration**: Add weight/cap input fields
3. **Battle Type Selector**: Add UI for selecting battle type
4. **Simulation Options**: Add Monte Carlo, max turns, RNG seed controls

## 📖 Documentation

- **Integration Status**: `INTEGRATION_STATUS.md`
- **Testing Guide**: `INTEGRATION_TESTING_GUIDE.md`
- **Feature README**: `features/battle-setup/README.md`

## 🎯 Key Files

- **Setup Page**: `app/battle/setup/page.tsx`
- **Client Wrapper**: `features/battle-setup/BattleSetupPageClient.tsx`
- **Form Component**: `features/battle-setup/components/BattleSetupForm.tsx`
- **API Route**: `app/api/battles/simulate/route.ts`
- **Service**: `server/services/BattleSimulationService.ts`
- **Results Panel**: `features/battle-results/BattleResultsPanel.tsx`

## 💡 Tips

- Use the Profile Integration Bridge for quick testing with existing profiles
- Drafts are auto-saved to localStorage (cleared on browser data reset)
- Results are cached for 60 seconds (identical requests are faster)
- Timeline virtualization activates automatically for > 20 events
