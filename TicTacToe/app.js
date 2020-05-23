const X_CLASS = 'x'
const CIRCLE_CLASS = 'circle'
const winCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
]

const cellElements = document.querySelectorAll('[data-cell]')
const board = document.getElementById('board')
const winningMsgElement = document.getElementById('winningMessage')
const winMsgText = document.querySelector('[data-winning-message-text]')
const restartButton = document.getElementById('restartButton')
let circleTurn


startGame()

restartButton.addEventListener('click', startGame)

function startGame(){
    circleTurn = false
    cellElements.forEach(cell =>{
        cell.classList.remove(X_CLASS)
        cell.classList.remove(CIRCLE_CLASS)
        cell.removeEventListener('click', handleClick)
        cell.addEventListener('click', handleClick, {once : true})
    })
    setBoardHoverClass()
    winningMsgElement.classList.remove('show')
}

function handleClick(e){
    const cell = e.target
    const currentClass = circleTurn ? CIRCLE_CLASS : X_CLASS
    placeMark(cell, currentClass)

    if(checkWin(currentClass))
        endGame(false)
    else if(isDraw()){
        endGame(true)
    }
    else{
        swapTurns()
        setBoardHoverClass()    
    }
}


function placeMark(cell, currentClass){
    cell.classList.add(currentClass)
}

function swapTurns(){
    circleTurn = !circleTurn
}

function setBoardHoverClass(){
    board.classList.remove(X_CLASS)
    board.classList.remove(CIRCLE_CLASS)
    if(circleTurn){
        board.classList.add(CIRCLE_CLASS)
    }
    else{
        board.classList.add(X_CLASS)
    }
}

function isDraw(){
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) ||
                cell.classList.contains(CIRCLE_CLASS)
    })
}

function endGame(draw){
    if(draw){
        winMsgText.innerText = 'DRAW!'
    }
    else{
        winMsgText.innerText = `${circleTurn ? "O-" : "X-"}Wins!`
    }
    winningMsgElement.classList.add('show')
}

function checkWin(currentClass){
    return winCombinations.some(combinations =>{
        return combinations.every(index =>{
            return cellElements[index].classList.contains(currentClass)
        })
    })
}