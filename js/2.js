'use strict';

/**
 * Телефонная книга
 */
const phoneBook = new Map();

const commands = {
    Создай : CreateContact,
    Удали : DeleteContact,
    Добавь : AddContact,
    Покажи : ShowContact
};


/**
 * Вызывайте эту функцию, если есть синтаксическая ошибка в запросе
 * @param {number} lineNumber – номер строки с ошибкой
 * @param {number} charNumber – номер символа, с которого запрос стал ошибочным
 */
function syntaxError(lineNumber, charNumber) {
    throw new Error(`SyntaxError: Unexpected token at ${lineNumber}:${charNumber}`);
}

/**
 * Выполнение запроса на языке pbQL
 * @param {string} query
 * @returns {string[]} - строки с результатами запроса
 */
function run(query) {
    const splitQuery = query.split(';');
    const result = [];
    splitQuery.forEach((cmnd, line) => {
        if (line === splitQuery.length - 1 && cmnd === '') {
            return;
        }
        //console.info(query, line);
        const index = cmnd.indexOf(' ');
        if (index === -1) {
            syntaxError(line + 1, 1);
        }

        const commandString = cmnd.substring(0, index);
        if (!commands.hasOwnProperty(commandString)) {
            syntaxError(line + 1, 1);
        }
        const command = commands[commandString];
        command(cmnd, line, result);

        if (line === splitQuery.length - 1) {
            syntaxError(line + 1, cmnd.length + 1);
        }
    })

    return result;
}

function CreateContact(query, line) {
    if (query.substring(7, 15) !== "контакт ") {
        syntaxError(line + 1, 8);
    }
    const nameString = query.substr(15);
    if (!phoneBook.has(nameString)) {
        phoneBook.set(nameString, {
            phones: [],
            mails: []
        });
    }
}

function parsePhonesAndMails(query, line, startIndex, queryPhones, queryMails) {
    let i = startIndex;
    while (true) {
        if (query.substr(i, 8) === "телефон ") {
            i += 8;
            const phone = query.substr(i, 11);
            if (!phone.match(/\d{10} /)) {
                syntaxError(line + 1, i + 1);
            }
            queryPhones.push(phone);
            i += 11;
        } 
        else if (query.substr(i, 6) === "почту ") {
            i += 6;
            const mail = query.substring(i, query.indexOf(' ', i));
            if (mail.length === 0) {
                syntaxError(line + 1, i + 1);
            }
            queryMails.push(mail);
            i += mail.length + 1;
        }
        else { syntaxError(line + 1, i + 1); }

        if (query.substr(i, 2) === "и ") {
            i += 2;
        } 
        else if (query.substr(i, 4) === "для ") {
            i += 4;
            break;
        } 
        else {
            syntaxError(line + 1, i + 1);
        }
    }

    if (query.substr(i, 9) !== "контакта ") {
        syntaxError(line + 1, i + 1);
    }
    i += 9;

    return i;
}

function DeleteContact(query, line) {
    if (query.substring(6, 14) === "контакт ") {
        const nameString = query.substr(14);
        phoneBook.delete(nameString);
    } 
    else if (query.substring(6, 16) === "контакты, ") {
        if (query.substring(16, 20) !== "где ") {
            syntaxError(line + 1, 17);
        } 
        else if (query.substring(20, 25) !== "есть ") {
            syntaxError(line + 1, 21);
        }
        const request = query.substr(25);
        if (request.length === 0) {
            return;
        }
        phoneBook.forEach((value, key) => {
            if (isIncludeRequest(value, key, request)) {
                phoneBook.delete(key);
            }
        });
    } 
    else {
        const queryPhones = [], queryMails = [];
        let i = parsePhonesAndMails(query, line, 6, queryPhones, queryMails);
        const nameString = query.substr(i);
        if (phoneBook.has(nameString)) {
            const contact = phoneBook.get(nameString);
            contact.phones = contact.phones.filter((phone) => !queryPhones.includes(phone));
            contact.mails = contact.mails.filter((mail) => !queryMails.includes(mail));
        }
    }
}

function AddContact(query, line) {
    const queryPhones = [], queryMails = [];
    let i = parsePhonesAndMails(query, line, 7, queryPhones, queryMails);

    const nameString = query.substr(i);
    if (phoneBook.has(nameString)) {
        const contact = phoneBook.get(nameString);
        for (let phone of queryPhones) {
            if (!contact.phones.includes(phone)) {
                contact.phones.push(phone);
            }
        }
        for (let mail of queryMails) {
            if (!contact.mails.includes(mail)) {
                contact.mails.push(mail);
            }
        }
    }
}

function ShowContact(query, line, res) {
    const fields = [];
    let i = 7;
    while (true) {
        if (query.substr(i,6) === "почты ") {
            fields.push("mails");
            i += 6;
        } else if (query.substr(i, 9) === "телефоны ") {
            fields.push("phones");
            i += 9;
        } else if (query.substr(i, 4) === "имя ") {
            fields.push("name");
            i += 4;
        } else {
            syntaxError(line + 1, i + 1);
        }

        if (query.substr(i, 2) === "и ") {
            i += 2;
        } else if (query.substr(i, 4) === "для ") {
            i += 4;
            break;
        } else {
            syntaxError(line + 1, i + 1);
        }
    }

    if (query.substr(i, 11) !== "контактов, ") {
        syntaxError(line + 1, i + 1);
    }
    i += 11;
    if (query.substr(i, 4) !== "где ") {
        syntaxError(line + 1, i + 1);
    }
    i += 4;
    if (query.substr(i, 5) !== "есть ") {
        syntaxError(line + 1, i + 1);
    }
    i += 5;

    const request = query.substr(i);
    if (request.length === 0) {
        return;
    }

    addAllForShowToResult(fields, res, request);
}

function addAllForShowToResult(fields, res, request){
    phoneBook.forEach((value, key) => {
        if (isIncludeRequest(value, key, request)) {
            let contactFields = "";
            for (let field of fields) {
                if (field === "name") {
                    contactFields += `${key};`;
                } else if (field === "phones") {
                    let phones = "";
                    for (let phone of value.phones) {
                        phones += GetPrettyPhoneNumber(phone);
                    }
                    contactFields += `${phones.slice(0, -1)};`
                } else {
                    let mails = "";
                    for (let mail of value.mails) {
                        mails += `${mail},`;
                    }
                    contactFields += `${mails.slice(0, -1)};`
                }
            }
            res.push(contactFields.slice(0, -1));
        }
    });
}

function GetPrettyPhoneNumber(phone){
    return `+7 (${phone.substr(0, 3)}) ${phone.substr(3, 3)}-` +
    `${phone.substr(6, 2)}-${phone.substr(8, 2)},`;
}

function isIncludeRequest(value, key, request){
    return key.includes(request) || infoIncludeRequest(value, request);
}

function infoIncludeRequest(value, request){
    for (let phone of value.phones) {
        if (phone.includes(request)) {
            return true;
        }
    }
    for (let mail of value.mails) {
        if (mail.includes(request)) {
            return true;
        }
    }
}


module.exports = { phoneBook, run };


// // Пример 1
// console.info(run('Покажи имя для контактов, где есть ий;'))
// /*
//     []
// */

// // Пример 2
// console.info(run(
//     'Создай контакт Григорий;' +
//     'Создай контакт Василий;' +
//     'Создай контакт Иннокентий;' +
//     'Покажи имя для контактов, где есть ий;'
// ))
// /*
//     [
//         'Григорий',
//         'Василий',
//         'Иннокентий'
//     ]
// */

// phoneBook.clear();

// // Пример 3
// console.info(run(
//     'Создай контакт Григорий;' +
//     'Создай контакт Василий;' +
//     'Создай контакт Иннокентий;' +
//     'Покажи имя и имя и имя для контактов, где есть ий;'
// ))
// /*
//     [
//         'Григорий;Григорий;Григорий',
//         'Василий;Василий;Василий',
//         'Иннокентий;Иннокентий;Иннокентий'
//     ]
// */
// phoneBook.clear();

// // Пример 4
// console.info(run(
//     'Создай контакт Григорий;' +
//     'Покажи имя для контактов, где есть ий;' +
//     'Покажи имя для контактов, где есть ий;'
// ))
// /*
//     [
//         'Григорий',
//         'Григорий'
//     ]
// */
// phoneBook.clear();

// // Пример 5
// console.info(run(
//     'Создай контакт Григорий;' +
//     'Удали контакт Григорий;' +
//     'Покажи имя для контактов, где есть ий;'
// ))
// /*
//     []
// */
// phoneBook.clear();

// // Пример 6
// console.info(run(
//     'Создай контакт Григорий;' +
//     'Добавь телефон 5556667787 для контакта Григорий;' +
//     'Добавь телефон 5556667788 и почту grisha@example.com для контакта Григорий;' +
//     'Покажи имя и телефоны и почты для контактов, где есть ий;'
// ))
// /*
//     [
//         'Григорий;+7 (555) 666-77-87,+7 (555) 666-77-88;grisha@example.com'
//     ]
// */
// phoneBook.clear();

// Пример 7
// console.info(run(
//     'Создай контакт Григорий;' +
//     'Добавь телефон 5556667788 для контакта Григорий;' +
//     //'Удали телефон 5556667788 для контакта Григорий;' +
//     'Покажи имя и телефоны для контактов, где есть 555;'
// ))
/*
    [
        'Григорий;'
    ]
*/
