# RULE ENGINE

## Pipeline

```text
WorldEvent
→ candidate rules
→ conditions
→ ordered actions
→ state transition
→ resulting events
```

## P0 triggers
- onClick
- onInteract
- onEnterZone
- onExitZone
- onObjectEnterZone
- onObjectLeaveZone
- onStateEquals
- onSequenceComplete
- onTimer
- onProximity

## P0 actions
- open/close
- lock/unlock
- show/hide
- enable/disable
- highlight/unhighlight
- moveTo
- resetTransform
- setLight
- playSound
- showMessage
- setState
- incrementState
- completeObjective
- resetObject

## Safety
- bounded event depth
- bounded action count
- repeated-event detection
- atomic transaction
- no generated executable code
