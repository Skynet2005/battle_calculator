# Integration Testing Guide

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to `/battle/setup`** in your browser

3. **Test the Integration Bridge:**
   - Click "Load Current Profile" button
   - Review any validation warnings
   - Click "Simulate Battle" button
   - Review results in the panel below

## Testing Checklist

### Basic Functionality
- [ ] Page loads without errors
- [ ] Integration bridge component renders
- [ ] Profile loading works
- [ ] Profile validation shows warnings (if applicable)
- [ ] Simulation API call succeeds
- [ ] Results panel displays

### Results Display
- [ ] Summary tile shows winner and score
- [ ] Decision rationale card displays explanation
- [ ] Metrics grid shows player vs opponent stats
- [ ] Timeline list renders events
- [ ] Inflection points are clickable
- [ ] Joiner impact breakdown displays (if joiners present)

### Performance
- [ ] Timeline virtualization activates for > 20 events
- [ ] Page remains responsive during simulation
- [ ] Cache works (second identical request is faster)

### Error Handling
- [ ] Invalid profile shows validation errors
- [ ] API errors display user-friendly messages
- [ ] Network errors are handled gracefully

## Common Test Scenarios

### Scenario 1: Basic Simulation
1. Load a profile with rally configuration
2. Click "Simulate Battle"
3. Verify results display correctly
4. Check that winner, turns, and metrics are shown

### Scenario 2: Profile Validation
1. Load a profile missing rally config
2. Verify validation warnings appear
3. Fix the profile in existing tabs
4. Reload and verify validation passes

### Scenario 3: Timeline Navigation
1. Run a simulation with multiple turns
2. Click on inflection points
3. Verify timeline scrolls to correct turn
4. Verify turn is highlighted briefly

### Scenario 4: Cache Testing
1. Run a simulation
2. Note the duration
3. Run the same simulation again immediately
4. Verify second run is faster (cached)

## Troubleshooting

### Profile Won't Load
- Check browser console for errors
- Verify you're logged in
- Check that profiles exist in database
- Try refreshing the page

### Simulation Fails
- Check browser console for detailed error
- Verify profile has valid rally configuration
- Check network tab for API response
- Review server logs for errors

### Results Don't Display
- Check that API returned valid response
- Verify viewModel structure matches expected format
- Check browser console for React errors
- Ensure all required data is present

### Timeline Not Virtualizing
- Verify timeline has > 20 events
- Check browser console for virtualization errors
- Ensure @tanstack/react-virtual is installed

## Next Steps for Full Integration

1. **Integrate Form Components:**
   - Extract reusable form sections from PlayerTab
   - Extract reusable form sections from OpponentTab
   - Extract reusable form sections from RallyTab
   - Wire them into BattleSetupForm

2. **Enhance Joiner Configuration:**
   - Add weight input fields
   - Add cap configuration
   - Add joiner skill selection UI
   - Validate total contribution

3. **Add Simulation Options:**
   - Monte Carlo toggle
   - Simulation count input
   - Max turns input
   - RNG seed input

4. **Improve Results:**
   - Add export functionality
   - Add comparison with previous runs
   - Add detailed breakdowns
   - Add charts/graphs

5. **Migration:**
   - Add navigation link to new route
   - Add deprecation notice to old tabs
   - Monitor usage metrics
   - Plan removal timeline

## API Testing

### Using curl

```bash
# Get auth token first (login via browser or API)
TOKEN="your-auth-token"

# Test simulation endpoint
curl -X POST http://localhost:3000/api/battles/simulate \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=$TOKEN" \
  -d @test-request.json
```

### Test Request Format

See `features/battle-setup/schemas/battle.ts` for the full schema.
Minimal example:

```json
{
  "player": { ... },
  "opponent": { ... },
  "rally": {
    "leader": { "infantry": null, "lancer": null, "marksman": null },
    "joiners": [],
    "battleType": "Rally"
  }
}
```

## Performance Benchmarks

Expected performance:
- Profile loading: < 100ms
- Profile conversion: < 50ms
- API call (uncached): < 500ms for simple battles
- API call (cached): < 50ms
- Results rendering: < 100ms
- Timeline virtualization: Handles 1000+ events smoothly

## Known Limitations

1. Joiner weights default to 0 (needs UI)
2. Battle type defaults to 'Rally' (needs selector)
3. Form doesn't yet integrate with existing tabs
4. Some edge cases in profile conversion
5. Buff side detection could be improved

These will be addressed in future iterations.
