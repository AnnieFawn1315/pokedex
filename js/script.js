document.addEventListener('init', (event) => {
    const page = event.target

    // CG: I moved what you had in the ons.ready() into a function loadFullList() and then call it here
    if (page.id === 'list-page')
        loadFullList()

    if (page.id === 'single-pokemon-page') {
        const slug = page.data.item

        getSinglePokemon(slug)
    }
})

const instance = axios.create({
    baseURL: 'https://pokeapi.co/api/v2',
    timeout: 1000
})

const spinnerModal = document.querySelector('#spinner-modal')

let nextButton
let previousButton
let searchField
let searchButton
let hasNextPage = true

document.addEventListener('DOMContentLoaded', (event) => {
    searchButton = document.querySelector('#search-button')
    searchField = document.querySelector('#search-field')

    searchButton.addEventListener('click', (event) => {
        searchPokemon()
    }, false)

    previousButton = document.querySelector('#pagination-previous')
    nextButton = document.querySelector('#pagination-next')

    previousButton.addEventListener('click', (event) => {
        if (page === 1)
            return false

        page--
        loadFullList(page)
    }, false)

    nextButton.addEventListener('click', (event) => {
        if (!hasNextPage)
            return false

        page++
        loadFullList(page)
    }, false)
})

let page = 1

async function searchPokemon() {
    if (!searchField.value)
        return false

    try {
        const { data: pokemon } = await instance.get(`/pokemon/${searchField.value}`)

        pushOverView(pokemon.id)
    } catch {
        ons.notification.alert('Could not find pokemon')
    }
}

// CG: this was previously embedded in the ons.ready() broke it out
async function loadFullList(page = 1, limit = 20) {
    startSpinner()

    const offset = (page - 1) * limit

    try {
        const { data } = await instance.get(`/pokemon?offset=${offset}&limit=${limit}`)
        hasNextPage = data.next

        const pokemon = data.results
        const pokemonList = pokemon.map(pokemon => pokemon.url.replace('https://pokeapi.co/api/v2/pokemon/', '').replace('/', ''))
        const pokemonData = await getPokemonListDetails(pokemonList)

        sendData(pokemonData)
    } catch (error) {
        console.error(error)
    } finally {
        stopSpinner()
    }
}

function sendData(pokemon = []) {
    const itemsList = document.getElementById('list-item') // this is no longer null since this is no longer part of template.

    // Clear List
    itemsList.innerHTML = ''

    pokemon.forEach(pokemonDetails => {
        const types = []

        pokemonDetails.types.forEach(type => {
            types.push(type.type.name)
        })

        itemsList.appendChild(
            ons.createElement(`
              <ons-list>
                <ons-list-header>${pokemonDetails.name}</ons-list-header>
                <ons-list-item>
                  <div class="left">
                    <img class="pokes" src="https://pokeres.bastionbot.org/images/pokemon/${pokemonDetails.id}.png"/>
                  </div>

                  <div class="center">TYPE: ${types.join(', ')}</div>

                  <div class="right">
                    <ons-button id="pokemon-${pokemonDetails.id}" icon="md-caret-right"></ons-button>
                  </div>
                </ons-list-item>
              </ons-list>
          `)
        )

        const button = document.getElementById(`pokemon-${pokemonDetails.id}`)
        button.addEventListener('click', () => pushOverView(pokemonDetails.id), false)
    })
}

// SINGLE PAGE
function pushOverView(item) {
    document.querySelector('#myNavigator').pushPage('single-pokemon', { data: { item: item } })
}

function startSpinner() {
    spinnerModal.show()
}

function stopSpinner() {
    spinnerModal.hide()
}

// CG: for now I just wanted to check that it was working so I used jQuery you can revert to fetch if you'd like
async function getSinglePokemon(slug) {
    startSpinner()

    try {
        const { data: pokemon } = await instance.get(`/pokemon/${slug}`)

        description(pokemon)
    } catch (error) {
        console.error(error)
    } finally {
        stopSpinner()
    }
}

async function getPokemonListDetails(pokemonList) {
    const promises = pokemonList.map(pokemonId => instance.get(`/pokemon/${pokemonId}`))

    try {
        const responses = await Promise.all(promises)

        const pokemonData = responses.map(pokemon => pokemon.data)

        return pokemonData
    } catch (error) {
        console.error(error)
    }
}

function description(pokemon) {
    const moreItemList = document.getElementById('description')

    moreItemList.appendChild(
        ons.createElement(`
          <div class="pokemon-singles">
            <h2>${pokemon.name}</h2>

            <img class="pokes" src="https://pokeres.bastionbot.org/images/pokemon/${pokemon.id}.png"/><br>

            <ul>
              <li>Height:${pokemon.height}</li>
              <li>Weight:${pokemon.weight}</li>
            </ul>
          </div>
        `)
    )
}
