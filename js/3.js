'use strict';

const isExtraTaskSolved = true;
const WORK_DAYS = ['ПН', 'ВТ', 'СР'];
const MINUTES_IN_DAY = 1440;
const WEEK_MINUTES = {
    ПН: 0,
    ВТ: 1 * MINUTES_IN_DAY,
    СР: 2 * MINUTES_IN_DAY
};
const MAX_GAP = MINUTES_IN_DAY * 3;


/**
 * @param {Object} schedule Расписание Банды
 * @param {number} duration Время на ограбление в минутах
 * @param {Object} workingHours Время работы банка
 * @param {string} workingHours.from Время открытия, например, "10:00+5"
 * @param {string} workingHours.to Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const bankTimeZone = getTimeZone(workingHours);
    const timeToRob = [];
    const availableTime = [];

    for (const arrayOfGaps of Object.values(schedule)) {
        for (const gap of arrayOfGaps) {
            let [from, to] = Object.values(gap).map(parseGap);
            for (let mins = from; mins < to; mins++) {
                availableTime[mins] = false;
            }
        }
    }

    let [from, to] = Object.values(workingHours).map(parseGap);
    for (let day = 0; day < 3; day++) {
        for (let mins = from; mins < to; mins++) {
            const currentMin = WEEK_MINUTES[WORK_DAYS[day]] + mins;
            if (availableTime[currentMin] === undefined) {
                availableTime[currentMin] = true;
            }
        }
    }

    let currentMin = 0;
    while (currentMin < MAX_GAP) {
        let currentGap = 0;
        while (currentGap + currentMin < MAX_GAP && currentGap < duration &&
            availableTime[currentGap + currentMin]) {
            currentGap++;
        }
        if (currentGap === duration) {
            timeToRob.push(currentMin);
            currentMin += 30;
        } else {
            currentMin++;
        }
    }
    //console.info(timeToRob);

    function parseGap(date) {
        const splitDate = date.split(' ');
        const day_timeAndZone = splitDate.length === 1 ? ['ПН', date] : splitDate;
        const day = day_timeAndZone[0];
        const timeAndZone = day_timeAndZone[1];
        const time_timeZone = timeAndZone.split('+');
        const time = time_timeZone[0];
        const timeZone = time_timeZone[1];
        const splitTime = time.split(':').map(string => parseInt(string));
        return ((splitTime[0] + bankTimeZone - timeZone) * 60 + splitTime[1] + WEEK_MINUTES[day]);
    }

    function getTimeZone(workingHours) {
        return parseInt(workingHours.from.split('+')[1]);
    }

    let currentGap = 0;

    return {
        /**
         * Найдено ли время
         * @returns {boolean}
         */
        exists() {
            return timeToRob.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами
         * для ограбления во временной зоне банка
         *
         * @param {string} template
         * @returns {string}
         *
         * @example
         * ```js
         * getAppropriateMoment(...).format('Начинаем в %HH:%MM (%DD)') // => Начинаем в 14:59 (СР)
         * ```
         */
        format(template) {
            if (!this.exists()) {
                return '';
            }

            const date = timeToRob[currentGap];
            const day = WORK_DAYS[Math.floor(date / MINUTES_IN_DAY)];
            let hours = String(Math.floor(date / 60) % 24).padStart(2, '0');
            let minutes = String(date % 60).padStart(2, '0');
            //console.info(minutes);
            return template.replace(/%DD/, day).replace(/%HH/, hours).replace(/%MM/, minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @note Не забудь при реализации выставить флаг `isExtraTaskSolved`
         * @returns {boolean}
         */
        tryLater() {
            if (currentGap + 1 < timeToRob.length) {
                currentGap++;
                return true;
            }
            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,
    isExtraTaskSolved
};







// const gangSchedule = {
//     Danny: [{
//         from: 'ПН 12:00+5',
//         to: 'ПН 17:00+5'
//     }, {
//         from: 'ВТ 13:00+5',
//         to: 'ВТ 16:00+5'
//     }],
//     Rusty: [{
//         from: 'ПН 11:30+5',
//         to: 'ПН 16:30+5'
//     }, {
//         from: 'ВТ 13:00+5',
//         to: 'ВТ 16:00+5'
//     }],
//     Linus: [{
//             from: 'ПН 09:00+3',
//             to: 'ПН 14:00+3'
//         },
//         {
//             from: 'ПН 21:00+3',
//             to: 'ВТ 09:30+3'
//         },
//         {
//             from: 'СР 09:30+3',
//             to: 'СР 15:00+3'
//         }
//     ]
// };

// const bankWorkingHours = {
//     from: '10:00+5',
//     to: '18:00+5'
// };

// // Время не существует
// const longMoment = getAppropriateMoment(gangSchedule, 121, bankWorkingHours);

// // Выведется `false` и `""`
// console.info(longMoment.exists());
// console.info(longMoment.format('Метим на %DD, старт в %HH:%MM!'));

// // Время существует
// const moment = getAppropriateMoment(gangSchedule, 90, bankWorkingHours);

// // Выведется `true` и `"Метим на ВТ, старт в 11:30!"`
// console.info(moment.exists());
// console.info(moment.format('Метим на %DD, старт в %HH:%MM!'));

// // Дополнительное задание
// // Вернет `true`
// moment.tryLater();
// // `"ВТ 16:00"`
// console.info(moment.format('%DD %HH:%MM'));

// // Вернет `true`
// moment.tryLater();
// // `"ВТ 16:30"`
// console.info(moment.format('%DD %HH:%MM'));

// // Вернет `true`
// moment.tryLater();
// // `"СР 10:00"`
// console.info(moment.format('%DD %HH:%MM'));

// // Вернет `false`
// moment.tryLater();
// // `"СР 10:00"`
// console.info(moment.format('%DD %HH:%MM'));