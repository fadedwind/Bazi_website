import {defineStore} from 'pinia';
import {LunarUtil} from 'lunar-javascript';
import {timeFormat} from "@/utils/transform";
import {PILLAR_FIELD} from "@/config/map";

const DEFAULT_TEMPLATE_FILL = {year: "",month: "",day: "",time: "",}
const ELEMENT_LABELS = ['金', '木', '水', '火', '土'];

const createEmptyElementList = () => ELEMENT_LABELS.map(() => ({
    element: '',
    total: 0,
    sacle: 0,
    shishen: ''
}));

const GAN_COMBOS = [
    {members: ['甲', '己'], label: '甲己合土'},
    {members: ['乙', '庚'], label: '乙庚合金'},
    {members: ['丙', '辛'], label: '丙辛合水'},
    {members: ['丁', '壬'], label: '丁壬合木'},
    {members: ['戊', '癸'], label: '戊癸合火'}
];

const ZHI_HE = [
    {members: ['子', '丑'], label: '子丑合'},
    {members: ['寅', '亥'], label: '寅亥合'},
    {members: ['卯', '戌'], label: '卯戌合'},
    {members: ['辰', '酉'], label: '辰酉合'},
    {members: ['巳', '申'], label: '巳申合'},
    {members: ['午', '未'], label: '午未合'}
];

const ZHI_CHONG = [
    {members: ['子', '午'], label: '子午冲'},
    {members: ['丑', '未'], label: '丑未冲'},
    {members: ['寅', '申'], label: '寅申冲'},
    {members: ['卯', '酉'], label: '卯酉冲'},
    {members: ['辰', '戌'], label: '辰戌冲'},
    {members: ['巳', '亥'], label: '巳亥冲'}
];

const ZHI_PO = [
    {members: ['子', '酉'], label: '子酉破'},
    {members: ['丑', '辰'], label: '丑辰破'},
    {members: ['寅', '亥'], label: '寅亥破'},
    {members: ['卯', '午'], label: '卯午破'},
    {members: ['申', '巳'], label: '申巳破'},
    {members: ['未', '戌'], label: '未戌破'}
];

const ZHI_HAI = [
    {members: ['子', '未'], label: '子未害'},
    {members: ['丑', '午'], label: '丑午害'},
    {members: ['寅', '巳'], label: '寅巳害'},
    {members: ['卯', '辰'], label: '卯辰害'},
    {members: ['申', '亥'], label: '申亥害'},
    {members: ['酉', '戌'], label: '酉戌害'}
];

const ZHI_XING = [
    {members: ['子', '卯'], label: '子卯刑'},
    {members: ['寅', '巳'], label: '寅巳刑'},
    {members: ['巳', '申'], label: '巳申刑'},
    {members: ['申', '寅'], label: '申寅刑'},
    {members: ['丑', '戌'], label: '丑戌刑'},
    {members: ['戌', '未'], label: '戌未刑'},
    {members: ['未', '丑'], label: '未丑刑'}
];

const ZHI_SANHE = [
    {members: ['申', '子', '辰'], label: '申子辰三合水'},
    {members: ['亥', '卯', '未'], label: '亥卯未三合木'},
    {members: ['寅', '午', '戌'], label: '寅午戌三合火'},
    {members: ['巳', '酉', '丑'], label: '巳酉丑三合金'}
];

const ZHI_SANHUI = [
    {members: ['亥', '子', '丑'], label: '亥子丑三会水'},
    {members: ['寅', '卯', '辰'], label: '寅卯辰三会木'},
    {members: ['巳', '午', '未'], label: '巳午未三会火'},
    {members: ['申', '酉', '戌'], label: '申酉戌三会金'}
];

const ZHI_ORDER = LunarUtil.ZHI;

function buildPositions(list) {
    const map = {};
    list.forEach((value, index) => {
        if (!value) return;
        if (!map[value]) {
            map[value] = [];
        }
        map[value].push(index);
    });
    return map;
}

function createRelationItem(type, label, indexes, values) {
    const sorted = [...indexes].sort((a, b) => a - b);
    return {
        type,
        label,
        title: label,
        mark: sorted.map(idx => ({
            label: values[idx] || '',
            index: idx
        }))
    };
}

function pushPairRelations(result, type, defs, positions, values, usedKeys) {
    defs.forEach(def => {
        const first = positions[def.members[0]]?.[0];
        const second = positions[def.members[1]]?.[0];
        if (first === undefined || second === undefined) return;
        const key = `${type}:${def.label}:${[first, second].sort().join('-')}`;
        if (usedKeys.has(key)) return;
        usedKeys.add(key);
        result.push(createRelationItem(type, def.label, [first, second], values));
    });
}

function pushTripleRelations(result, type, defs, positions, values, usedKeys) {
    defs.forEach(def => {
        const indexes = def.members.map(member => positions[member]?.[0]);
        if (indexes.some(idx => idx === undefined)) return;
        const key = `${type}:${def.label}:${indexes.sort().join('-')}`;
        if (usedKeys.has(key)) return;
        usedKeys.add(key);
        result.push(createRelationItem(type, def.label, indexes, values));
    });
}

function calculateGanRelations(top) {
    const values = PILLAR_FIELD.map(field => top?.[field] || '');
    const positions = buildPositions(values);
    const usedKeys = new Set();
    const relations = [];
    pushPairRelations(relations, '天干合', GAN_COMBOS, positions, values, usedKeys);
    return relations;
}

function calculateZhiRelations(bottom) {
    const values = PILLAR_FIELD.map(field => bottom?.[field] || '');
    const positions = buildPositions(values);
    const usedKeys = new Set();
    const relations = [];

    pushPairRelations(relations, '六合', ZHI_HE, positions, values, usedKeys);
    pushPairRelations(relations, '冲', ZHI_CHONG, positions, values, usedKeys);
    pushPairRelations(relations, '破', ZHI_PO, positions, values, usedKeys);
    pushPairRelations(relations, '害', ZHI_HAI, positions, values, usedKeys);
    pushPairRelations(relations, '刑', ZHI_XING, positions, values, usedKeys);
    pushTripleRelations(relations, '三合', ZHI_SANHE, positions, values, usedKeys);
    pushTripleRelations(relations, '三会', ZHI_SANHUI, positions, values, usedKeys);

    // 穿：地支差值为3（或9）
    const branchIndexes = values.map(val => ZHI_ORDER.indexOf(val));
    for (let i = 0; i < branchIndexes.length; i++) {
        for (let j = i + 1; j < branchIndexes.length; j++) {
            const idxA = branchIndexes[i];
            const idxB = branchIndexes[j];
            if (idxA === -1 || idxB === -1) continue;
            const diff = Math.abs(idxA - idxB);
            if (diff === 3 || diff === 9) {
                const label = `${values[i]}${values[j]}穿`;
                const key = `穿:${label}:${i}-${j}`;
                if (usedKeys.has(key)) continue;
                usedKeys.add(key);
                relations.push(createRelationItem('穿', label, [i, j], values));
            }
        }
    }

    return relations;
}

export const useDetailStore = defineStore('detail', {
    state: () => {
        return {
            realname: "",
            gender: 1,
            timestamp: null,
            sect:0,
            datetime: {
                solar: "",
                lunar: ""
            },
            festival: {
                pre: {
                    label: "",time: ""
                },
                next: {
                    label: "",time: ""
                }
            },
            constellation: "",
            zodiac: "",
            top: DEFAULT_TEMPLATE_FILL,
            bottom: DEFAULT_TEMPLATE_FILL,
            bottom_hide: {
                year: [],month: [],day: [],time: []
            },
            empty: DEFAULT_TEMPLATE_FILL,
            start: {
                main: DEFAULT_TEMPLATE_FILL,
                assiste: DEFAULT_TEMPLATE_FILL,
            },
            trend: DEFAULT_TEMPLATE_FILL,
            nayin: DEFAULT_TEMPLATE_FILL,
            element: {
                relation: ELEMENT_LABELS.map(() => ''),
                pro_decl: [],
                include: { list: createEmptyElementList() },
                ninclude: { list: createEmptyElementList() }
            },
            selfsit: DEFAULT_TEMPLATE_FILL,
            embryo: [new Array(3).fill([])],
            tb_relation: {top:[],bottom:[]},
            gods: [],
            start_tend:DEFAULT_TEMPLATE_FILL,
            // AI聊天记录
            aiChat: {
                messages: [],
                defaultPromptShown: false,
                inputMessage: ''
            }
        };
    },
    actions: {
        set(data) {
            for (let key in data) {
                this[key] = data[key];
            }
            this.updateRelations();
        },
        updateRelations() {
            const topRelations = calculateGanRelations(this.top);
            const bottomRelations = calculateZhiRelations(this.bottom);
            this.tb_relation = {
                top: topRelations,
                bottom: bottomRelations
            };
        }
    },
    getters: {
        dayGan(state) {
            return state.top.day
        },
        startTendDate(state){
            let label = '出生后';
            const { start_tend } = state;
            const map = {year: "年",month: "月",day: "日",time: "时"}
            for(let key in map){
                if(start_tend[key]){
                    label = label + start_tend[key] + map[key]
                }
            }
            label += '后起运';
            return label;
        },
        defaultPayload(state){
            return {
                datetime: timeFormat(new Date(state.timestamp),'yyyy-mm-dd hh:MM:ss'),
                gender: state.gender,
                sect: state.sect,
            }
        }
    }
});
