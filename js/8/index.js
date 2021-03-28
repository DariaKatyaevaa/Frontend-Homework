const DELAY = 300;
let REQUEST_NUMBER = 0;

async function find_suggest_first() {
    
    const text = document.getElementById('search').value;
    find_suggest(text, 0);
}

async function find_suggest_second() {
    const text = document.getElementById('search2').value;
    find_suggest(text, 1);
}

async function find_suggest(text, n) {
    const localNumber = REQUEST_NUMBER++;
    if (text === '') {
        return;
    }
    const response = await fetch(
        `https://autocomplete.travelpayouts.com/places2?term=${text}&locale=ru&types[]=airport`
    );
    if (response.ok) {
        const cities = await response.json();
        setTimeout(() => {
            if (localNumber === REQUEST_NUMBER - 1) {
                let id = 0;
                cities.slice(0, Math.min(cities.length, 9)).forEach(city => {
                    document
                        .getElementsByClassName('search__input')[n]
                        .appendChild(create_suggest(n, city.city_name, city.code, id++));
                });
            }
        }, DELAY);
    }
}

function create_suggest(n, city, code, id) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'search__suggest search__element_height';
    element.textContent = `${city} ${code}`;
    element.id = id;
    element.onclick = () => {
        insert_elem(n, element);
        REQUEST_NUMBER += 1;
    };
    /*
    element.onkeydown = event => {
        const key = event.key;
        if(key === "Enter"){
            insert_elem(n, this);
        }
        else if(key === "Down"){
            const element_next = document.getElementById(element.id + 1);
            element_next.focus();
        }
        else if(key === "Up"){
            const element_prev = document.getElementById(element.id - 1);
            element_prev.focus();
        }
    };*/
    return element;
}

function insert_elem(n, element) {
    if(n === 0){
        document.getElementById('search').value = element.innerText;
        document.getElementById('search').oninput(null);
    }
    if(n === 1){
        document.getElementById('search2').value = element.innerText;
        document.getElementById('search2').oninput(null);
    }
    delete_suggest();
}

function delete_suggest() {
    const elements = document.getElementsByClassName('search__suggest');
    const len = elements.length;
    for (let i = 0; i < len; i++) {
        elements.item(0).remove();
    }
    
}