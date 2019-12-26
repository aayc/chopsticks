import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom'
import { useSpring, animated as anim } from 'react-spring';
import { useGesture, useDrag, useHover } from 'react-use-gesture'
import './App.css';

function Hand(props) {
  const [posProps, set] = useSpring(() => ({
    x: props.start_x, y: props.start_y, scale: 1, background: "hotpink"
  }))
  const bind = useGesture(props.owner === "player" ? {
    onDragStart: ({ event }) => {
      props.setDrag(props.dragid)
    },
    onDrag: ({ down, movement: [x, y] }) => {
      set({
        x: down && props.turn == 1 ? x + props.start_x : props.start_x,
        y: down && props.turn == 1 ? y + props.start_y : props.start_y,
        scale: down ? 1.2 : 1,
      })
    },
    onHover: ({ event, down, color: _ }) => {
      let over = event.dispatchConfig.registrationName === "onMouseEnter";
      set({
        background: over ? "lightgreen" : "hotpink"
      })
    },
    onDragEnd: ({ event }) => {
      props.onRelease(event)
    }
  } : {
    onHover: ({ event, down, color: _ }) => {
      let over = event.dispatchConfig.registrationName === "onMouseEnter";
      set({
        background: over && down ? "lightgreen" : "hotpink"
      })
    },
  })

  const handProps = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  return (
    <anim.div {...bind()}
      ref={props.refr}
      style={{
        ...posProps,
        ...handProps,
      }}>{props.fingers}</anim.div>
  )
}

function App() {
  const [fingers, setFingers] = useState([1, 2, 1, 1])
  const [dragid, setDrag] = useState(-1)
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const [turn, setTurn] = useState(1)
  const canSplit = ([a, b]) => (a + b) % 2 == 0 && a != b
  const split = ([a, b]) => [(a + b) / 2, (a + b) / 2]
  const attack = (a, b) => Math.min(a + b, 5) % 5

  const inBounds = (x, y, elem) => {
    let { left, right, top, bottom } = elem.getBoundingClientRect();
    return x >= left && x <= right && y >= top && y <= bottom
  }

  useEffect(() => {
    if (!handle_end_condition()) {
      let now_ai_plays = turn == 1
      setTurn(turn == 1 ? -1 : 1)
      if (now_ai_plays) {
        aiTurn()
      }
    }
  }, [fingers])

   /* TODO give AI animations
   * TODO work on graphics
   */

  const aiTurn = () => {
    let choose = (choices) => choices[Math.floor(Math.random() * choices.length)]
    let hand = choose([2, 3].filter(i => fingers[i] > 0))
    let target = choose([0, 1].filter(i => fingers[i] > 0))
    let attack_result = attack(fingers[hand], fingers[target])
    let fingers_update = fingers.slice(0, 4)
    console.log("attacking ", target, "with", hand)
    console.log("using ", fingers[hand], "against ", fingers[target])
    fingers_update[target] = attack_result
    console.log("new hand: ", fingers_update)
    setFingers(fingers_update)
  }

  const handle_end_condition = () => {
    let cond = fingers[0] == 0 && fingers[1] == 0 ? -1
        : (fingers[2] == 0 && fingers[3] == 0 ? 1 : 0)
    if (cond == 1) {
      alert("You win!")
      return true
    }
    else if (cond == -1) {
      alert("You lose...")
      return true
    }
    return false
  }

  const onRelease = (event) => {
    let self = dragid
    setDrag(-1)
    if (turn != 1) return;

    let [x, y] = [event.clientX, event.clientY]
    let collides = refs.map((r, i) => inBounds(x, y, r.current) && i != self)
    if (collides.some(c => c)) {
      let colliding_index = collides.flatMap((bool, index) => bool ? index : [])[0]
      console.log(JSON.stringify(colliding_index))

      if (colliding_index <= 1) {
        if (canSplit(fingers.slice(0, 2))) {
          let fingers_update = split(fingers.slice(0, 2))
          fingers_update.push(...fingers.slice(2))
          setFingers(fingers_update)
        }
        else {
          return
        }
      }
      else {
        // must be an attack on another
        let attack_result = attack(fingers[self], fingers[colliding_index])
        let fingers_update = fingers.slice(0, 4)
        console.log("executing attack")
        fingers_update[colliding_index] = attack_result
        console.log(fingers_update)
        setFingers(fingers_update)
      }
    }
  }

  return (
    <>
      <Hand start_x={-100} start_y={0}
            fingers={fingers[0]}
            turn={turn}
            owner={"player"}
            dragid={0}
            setDrag={setDrag}
            refr={refs[0]}
            onRelease={onRelease}/>
      <Hand start_x={100} start_y={0}
            fingers={fingers[1]}
            turn={turn}
            owner={"player"}
            dragid={1}
            setDrag={setDrag}
            refr={refs[1]}
            onRelease={onRelease}/>
      <br />
      <br />
      <Hand start_x={-100} start_y={100}
            refr={refs[2]}
            dragid={2}
            setDrag={setDrag}
            fingers={fingers[2]}
            turn={turn}
            owner={"ai"}/>
      <Hand start_x={100} start_y={100}
            refr={refs[3]}
            dragid={3}
            setDrag={setDrag}
            fingers={fingers[3]}
            turn={turn}
            owner={"ai"}/>
    </>
  )
}

export default App;
