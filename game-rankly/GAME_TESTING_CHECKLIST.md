# Rankly - Complete Edge Case Testing Checklist

## 🔍 JUDGE RECONNECTION DEBUG (PRIORITY)

### Setup for Testing
1. Start server: `node server.js`
2. Open 3 browser tabs (use incognito for separate sessions)
3. Create a room with 3 players minimum
4. Start the game and wait for all players to submit answers
5. Judge should see the ranking interface

### Test: Judge Refresh During Ranking
1. While judge is on ranking screen, press F12 to open DevTools Console
2. Refresh the judge's browser tab (F5 or Ctrl+R)
3. **COPY ALL CONSOLE LOGS** from both server terminal and browser console

### Expected Server Logs (Terminal)
```
[buildRoomSnapshot] ===== RANKING PHASE DEBUG =====
[buildRoomSnapshot] socketId: <judge-socket-id>
[buildRoomSnapshot] judgeSocketId: <same-socket-id>
[buildRoomSnapshot] isJudge: true
[buildRoomSnapshot] round.answers length: <number>
[buildRoomSnapshot] ✅ Added answersForRanking for judge: <number> answers
[reconnect] ===== SENDING SNAPSHOT =====
[reconnect] phase: ranking
[reconnect] isJudge: true
[reconnect] answersForRanking exists: true
```

### Expected Browser Logs (DevTools Console)
```
[restoreGameState] ===== JUDGE RECONNECTION DEBUG =====
[restoreGameState] Judge detected: TRUE
[restoreGameState] phase: ranking
[restoreGameState] answersForRanking exists: true
[restoreGameState] answersForRanking length: <number>
[restoreGameState] ✅ Showing ranking UI for judge
```

### What to Check
- [ ] Judge sees ranking interface after reconnecting
- [ ] All submitted answers are visible
- [ ] Rank dropdowns are present
- [ ] Submit button is visible
- [ ] Timer continues (if time remaining)

### If Issue Persists
**Please provide:**
1. Full server console output from reconnection
2. Full browser console output from reconnection  
3. Screenshot of what judge sees after reconnecting
4. Description: Does judge see "Waiting for players..." or ranking interface?

---

## 🎮 LOBBY & ROOM CREATION

### Basic Room Operations
- [. ] Create room with valid name
- [. ] Create room with empty name (should show error)
- [. ] Create room with very long name (20+ chars)
- [. ] Join room with valid code
- [. ] Join room with invalid/non-existent code
- [. ] Join room with empty code (should show error)
- [ .] Copy room code button works
- [ .] Room code displays correctly

### Player Management
- [. ] Host sees "HOST" badge
- [.] Non-host players don't see host controls
- [. ] Player avatars display with custom colors
- [. ] Avatar color picker works
- [. ] Avatar text color picker works
- [. ] Avatar changes reflect immediately for all players
- [. ] Player count updates correctly
- [. ] Player list shows all connected players

### Ready System
- [. ] Ready button toggles between Ready/Unready
- [. ] Ready count updates for all players
- [. ] Host cannot mark themselves ready
- [. ] Ready button hidden during game
- [ ] Ready states reset after game ends
- [. ] Ready button doesn't appear for host

### Game Mode Selection
- [. ] Standard mode selected by default
- [. ] Can switch to Custom mode
- [. ] Custom mode shows question input
- [. ] Question counter shows 0/5 initially
- [. ] Mode selection locked after room created
- [. ] Mode displays correctly for all players

---

## 🎯 GAME START

### Start Conditions
- [. ] Start button only visible to host
- [. ] Start button disabled with < 3 players
- [. ] Start button enabled when conditions met
- [. ] Cancel button appears during countdown
- [. ] Cancel button stops countdown
- [. ] 60-second countdown starts correctly
- [. ] Countdown displays for all players
- [. ] Game starts automatically after countdown

### Custom Mode Start
- [. ] Must enter exactly 5 questions
- [. ] Cannot start with < 5 questions
- [. ] Cannot start with > 5 questions
- [. ] Question validation shows correct count
- [. ] Empty lines ignored in question count
- [. ] Duplicate questions allowed
- [. ] Questions must match number of rounds

### Game Initialization
- [. ] All players transition to game screen
- [. ] Lobby UI hidden during game
- [. ] Game area visible
- [. ] Round 1/X displays correctly
- [. ] First question appears
- [. ] Judge assigned correctly
- [. ] Turn order randomized
- [. ] Ready button hidden during game

---

## 📝 ANSWERING PHASE

### Turn Management
- [. ] Correct player's turn indicated
- [. ] "Your turn" message shows for active player
- [. ] "[Name] is answering..." shows for others
- [. ] Answer input only enabled for active player
- [. ] Judge cannot answer (input disabled)
- [. ] Timer starts for each turn
- [. ] Timer displays correctly (countdown)
- [. ] Timer bar animates smoothly

### Answer Submission
- [. ] Submit button works
- [. ] Enter key submits answer
- [. ] Cannot submit empty answer
- [. ] Cannot submit after time runs out
- [. ] Cannot submit twice
- [. ] Duplicate answers rejected with message
- [. ] Answer feedback shows errors
- [. ] Button click sound plays
- [. ] Round start sound plays

### Turn Timeout
- [. ] Game moves to next player automatically
- [. ] Timer resets for next player

### Turn Progression
- [. ] All players get exactly one turn
- [. ] Turn order maintained throughout round
- [. ] Skips disconnected players correctly
- [. ] Transitions to ranking after all answers

---

## 🏆 RANKING PHASE

### Judge Ranking
- [. ] Only judge sees ranking interface
- [. ] Other players see "Judge is ranking..." message
- [. ] All answers displayed anonymously
- [. ] Dropdown shows ranks 1 to N (N = answer count)
- [. ] Cannot select same rank twice
- [. ] Submit button enabled when complete
- [. ] Ranking timer starts (configurable time)
- [. ] Ranking timer displays for judge

### Ranking Timeout
- [. ] Auto-ranks remaining answers when time expires
- [. ] Auto-rank uses sequential order
- [. ] Ranking UI hidden after timeout
- [. ] Submit button hidden after timeout
- [. ] Results shown immediately after timeout

### Ranking Submission
- [. ] Rankings saved correctly
- [. ] Points calculated properly (1st = N points, last = 1 point)
- [. ] Judge gets bonus points
- [. ] Results revealed with animation
- [. ] Reveal sound plays
- [. ] Results show player names
- [. ] Results show points earned
- [. ] Leaderboard updates

---

## 📊 RESULTS & LEADERBOARD

### Results Display
- [. ] Results appear after ranking
- [. ] Answers revealed one by one
- [. ] Player names shown with answers
- [. ] Points shown for each answer
- [. ] "(No Answer)" entries shown
- [. ] Timed out answers marked
- [. ] Judge's answer not in results

### Leaderboard
- [. ] Leaderboard visible in sidebar
- [. ] Shows all players
- [. ] Sorted by score (highest first)
- [. ] Top 3 get medal emojis (🥇🥈🥉)
- [. ] Scores update after each round
- [. ] Winner highlighted at game end
- [. ] Crown emoji for winner

### Round Progression
- [. ] "Next Round" button appears for host
- [. ] Button only visible to host
- [. ] Clicking starts next round
- [. ] Round counter increments
- [. ] New question appears
- [. ] New judge assigned (rotates)
- [. ] Turn order re-randomized
- [. ] Previous answers cleared

---

## 🎊 GAME END

### End Conditions
- [. ] Game ends after all rounds complete
- [. ] Game ends if < 3 players remain
- [. ] Winner ceremony appears
- [. ] Podium shows top 3 players
- [. ] Victory sound plays for normal end
- [. ] Game ended sound plays for early end
- [. ] Final leaderboard shown
- [. ] "Return to Lobby" button appears

### Winner Ceremony
- [. ] Top 3 players on podium
- [. ] 1st place in center (larger)
- [. ] 2nd place on left
- [. ] 3rd place on right
- [. ] Other players listed below
- [. ] Victory fanfare plays

### Return to Lobby
- [. ] 30-second auto-return timer starts
- [. ] Timer displays for all players
- [. ] Can return early via button
- [. ] All players return together
- [. ] Game state resets
- [. ] Scores reset to 0
- [. ] Ready states reset
- [. ] Can start new game

---

## 🔌 DISCONNECTION & RECONNECTION

### Player Disconnect During Lobby
- [. ] Player removed from player list
- [. ] Player count decrements
- [. ] Ready count updates if player was ready
- [. ] Host transfer if host disconnects
- [. ] Room deleted if all players leave
- [. ] Other players notified

### Player Disconnect During Game
- [. ] Player marked as disconnected
- [. ] Player's turn skipped with "(No Answer)"
- [. ] Game continues with remaining players
- [ ] Disconnected player's score preserved
- [. ] Game ends if < 3 players remain
- [. ] No infinite recursion in beginNextTurn

### Judge Disconnect
- [ ] During answering: Judge reassigned at ranking
- [ ] During ranking: Auto-ranks and continues
- [ ] New judge assigned for next round
- [ ] Game doesn't crash
- [ ] Other players notified

### Reconnection
- [ ] Player can rejoin with same token
- [ ] Player's score restored
- [ ] Player's avatar restored
- [ ] Player rejoins at current game state
- [ ] Reconnection works during any phase
- [ ] Reconnection timeout handled (5 minutes)

---

## ⚙️ HOST CONTROLS

### Game Rules
- [. ] Host can change number of rounds (5-20)
- [. ] Host can change minimum players (3-8)
- [. ] Host can change turn time (15-60s)
- [. ] Host can change multiplier (1-3)
- [. ] Rules apply to current game
- [. ] Rules visible to all players

### Player Management
- [. ] Host can kick players
- [. ] Kick dropdown shows all non-host players
- [. ] Kicked player removed immediately
- [. ] Kicked player sees notification
- [. ] Cannot kick during active game
- [. ] Host can reshuffle turn order

### Game Control
- [. ] Host can end game early
- [. ] End game shows confirmation
- [. ] All players return to lobby
- [. ] Host can close room
- [. ] Close room kicks all players
- [. ] Room deleted after close

---

## 🎨 UI & SETTINGS

### Sound Effects
- [. ] Button clicks play sound (if enabled)
- [. ] Round start sound plays
- [. ] Ranking reveal sound plays
- [. ] Victory fanfare plays at game end
- [. ] Game ended sound plays for early end
- [. ] All sounds respect toggle setting
- [. ] No sounds when toggle off
- [. ] No countdown ticks (removed)
- [. ] No time up buzzer (removed)

### Avatar Customization
- [. ] Avatar button (🎨) visible in header
- [. ] Avatar button opens modal
- [. ] Color picker works
- [. ] Text color picker works
- [. ] Preview updates in real-time
- [. ] Save button applies changes
- [. ] Cancel button discards changes
- [. ] Changes visible to all players
- [. ] Avatar locked during game

### Responsive Design
- [. ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [. ] Chat panel scrolls properly
- [. ] Leaderboard scrolls if many players
- [. ] Long questions wrap correctly
- [. ] Long answers wrap correctly

---

## 💬 CHAT SYSTEM

### Basic Chat
- [. ] Chat input works
- [. ] Send button sends message
- [. ] Enter key sends message
- [. ] Cannot send empty message
- [. ] Messages appear for all players
- [. ] Player name shown with message
- [. ] Messages scroll automatically
- [. ] Chat disabled during round (optional)

### Chat During Game
- [. ] Chat available in lobby
- [. ] Chat available during game
- [. ] Chat available during results
- [. ] Messages persist during game
- [. ] Chat history maintained
- [. ] Scroll to bottom on new message

---

## 🐛 ERROR HANDLING

### Network Errors
- [ ] Handles server disconnect gracefully
- [ ] Shows error message on connection loss
- [ ] Attempts reconnection
- [ ] Handles slow network
- [ ] Handles packet loss

### Invalid Actions
- [ ] Cannot join full room (if limit exists)
- [ ] Cannot join game in progress
- [ ] Cannot submit answer out of turn
- [ ] Cannot rank if not judge
- [ ] Cannot start game without permission
- [ ] All invalid actions show error messages

### Edge Cases
- [ ] Handles rapid button clicks
- [ ] Handles multiple simultaneous actions
- [ ] Handles browser refresh during game
- [ ] Handles tab close/reopen
- [ ] Handles server restart during game
- [ ] No memory leaks on long sessions
- [ ] No infinite loops
- [ ] No race conditions

---

## 🔒 SECURITY & VALIDATION

### Input Validation
- [ ] Name length limited (20 chars)
- [ ] Room code format validated
- [ ] Answer length limited (80 chars)
- [ ] Chat message length limited (60 chars)
- [ ] HTML/script tags escaped
- [ ] SQL injection prevented
- [ ] XSS attacks prevented

### Authorization
- [ ] Only host can start game
- [ ] Only host can change rules
- [ ] Only host can kick players
- [ ] Only judge can rank answers
- [ ] Only active player can submit answer
- [ ] Token-based reconnection secure

---

## 📱 BROWSER COMPATIBILITY

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Features
- [ ] WebSocket support
- [ ] LocalStorage support
- [ ] Web Audio API support
- [ ] CSS Grid/Flexbox support
- [ ] ES6+ JavaScript support

---

## 🎯 PERFORMANCE

### Load Times
- [ ] Initial page load < 2s
- [ ] Room creation instant
- [ ] Room join instant
- [ ] Game start < 1s
- [ ] Round transition < 500ms

### Responsiveness
- [ ] Button clicks respond instantly
- [ ] No UI lag during game
- [ ] Smooth animations
- [ ] No frame drops
- [ ] Efficient DOM updates

### Scalability
- [ ] Handles 8 players smoothly
- [ ] Handles 20 rounds
- [ ] Handles long game sessions
- [ ] Memory usage stable
- [ ] CPU usage reasonable

---

## 🧪 STRESS TESTING

### Rapid Actions
- [ ] Spam ready/unready button
- [ ] Spam submit button
- [ ] Spam chat messages
- [ ] Rapid room creation/deletion
- [ ] Rapid join/leave

### Concurrent Users
- [ ] Multiple rooms simultaneously
- [ ] Multiple games in progress
- [ ] Many players in one room
- [ ] High message frequency
- [ ] Server handles load

### Long Sessions
- [ ] Play 20+ rounds
- [ ] Stay in lobby for 30+ minutes
- [ ] Reconnect multiple times
- [ ] No memory leaks
- [ ] No performance degradation

---

## ✅ FINAL CHECKS

### User Experience
- [ ] Game is fun to play
- [ ] Rules are clear
- [ ] UI is intuitive
- [ ] No confusing states
- [ ] Error messages helpful
- [ ] Loading states clear

### Polish
- [ ] Animations smooth
- [ ] Sounds pleasant
- [ ] Colors consistent
- [ ] Typography readable
- [ ] Spacing comfortable
- [ ] No visual glitches

### Documentation
- [ ] README up to date
- [ ] How to Play clear
- [ ] Setup instructions work
- [ ] Known issues documented
- [ ] Version number updated

