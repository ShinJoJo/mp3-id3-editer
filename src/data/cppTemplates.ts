import { CppTemplate, CompatibilityCheckItem } from '../types';

export const cppTemplates: CppTemplate[] = [
  {
    id: 'win32-native-gui',
    name: 'Win32 原生 GUI 桌面程序 (无额外依赖)',
    category: 'gui_win32',
    description: '采用纯正 Win32 API 编写的原生窗口程序。零外部 DLL 依赖，启动毫秒级，非常适合 Windows 7 离线环境。',
    features: [
      '纯原生 Win32 API，无需安装任何 .NET / VC++ Redistributable 运行库',
      '支持原生窗口控件 (按钮、输入框、标签页、高分屏适配)',
      '静态编译后可独立生成单个小巧 .exe (小于 1MB)',
      '完美兼容 Win7 SP1 64位无网络环境'
    ],
    cppCode: `#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <commctrl.h>
#include <string>

// 控件 ID 定义
#define ID_BTN_CLICK 1001
#define ID_EDIT_INPUT 1002

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    static HWND hEdit, hBtn, hLabel;

    switch (msg) {
    case WM_CREATE:
        // 创建标签文本
        hLabel = CreateWindowExW(
            0, L"STATIC", L"欢迎使用 Win7 离线 C++ 原生应用程序！",
            WS_CHILD | WS_VISIBLE | SS_LEFT,
            30, 20, 420, 30, hwnd, NULL, GetModuleHandle(NULL), NULL
        );

        // 创建输入框
        hEdit = CreateWindowExW(
            WS_EX_CLIENTEDGE, L"EDIT", L"在这里输入内容...",
            WS_CHILD | WS_VISIBLE | ES_AUTOHSCROLL,
            30, 60, 420, 35, hwnd, (HMENU)ID_EDIT_INPUT, GetModuleHandle(NULL), NULL
        );

        // 创建按钮
        hBtn = CreateWindowExW(
            0, L"BUTTON", L"提交并处理",
            WS_TABSTOP | WS_VISIBLE | WS_CHILD | BS_DEFPUSHBUTTON,
            30, 110, 140, 40, hwnd, (HMENU)ID_BTN_CLICK, GetModuleHandle(NULL), NULL
        );
        break;

    case WM_COMMAND:
        if (LOWORD(wParam) == ID_BTN_CLICK) {
            wchar_t buffer[256];
            GetWindowTextW(hEdit, buffer, 256);
            std::wstring msgStr = L"您输入的内容是: ";
            msgStr += buffer;
            MessageBoxW(hwnd, msgStr.c_str(), L"提示", MB_OK | MB_ICONINFORMATION);
        }
        break;

    case WM_DESTROY:
        PostQuitMessage(0);
        break;

    default:
        return DefWindowProcW(hwnd, msg, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    InitCommonControls();
    
    WNDCLASSEXW wc = { sizeof(WNDCLASSEXW) };
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.lpszClassName = L"Win7OfflineAppClass";

    if (!RegisterClassExW(&wc)) {
        MessageBoxW(NULL, L"窗口类注册失败!", L"错误", MB_ICONERROR);
        return 0;
    }

    HWND hwnd = CreateWindowExW(
        0, wc.lpszClassName, L"Win7 离线 C++ 桌面程序",
        WS_OVERLAPPEDWINDOW ^ WS_THICKFRAME ^ WS_MAXIMIZEBOX,
        CW_USEDEFAULT, CW_USEDEFAULT, 500, 220,
        NULL, NULL, hInstance, NULL
    );

    if (!hwnd) return 0;

    ShowWindow(hwnd, nCmdShow);
    UpdateWindow(hwnd);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    return (int)msg.wParam;
}`,
    cmakeCode: `cmake_minimum_required(VERSION 3.10)
project(Win7OfflineApp CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 强制静态链接 C/C++ 运行库
if(MSVC)
    set(CompilerFlags
        CMAKE_CXX_FLAGS
        CMAKE_CXX_FLAGS_DEBUG
        CMAKE_CXX_FLAGS_RELEASE
    )
    foreach(CompilerFlag \${CompilerFlags})
        string(REPLACE "/MD" "/MT" \${CompilerFlag} "\${\${CompilerFlag}}")
    endforeach()
endif()

add_executable(Win7OfflineApp WIN32 main.cpp)
target_link_libraries(Win7OfflineApp PRIVATE comctl32 user32 gdi32)
`,
    mingwCommand: `g++ -O2 -std=c++11 main.cpp -o Win7OfflineApp.exe -mwindows -static -static-libgcc -static-libstdc++ -lcomctl32 -lgdi32 -luser32`,
    msvcInstructions: [
      '1. 打开 Visual Studio (推荐 VS2015 或 VS2017，完全兼容 Win7)',
      '2. 新建 "Win32 Desktop Application" 项目',
      '3. 进入 项目属性 -> C/C++ -> 代码生成 (Code Generation)',
      '4. 将 "运行库" (Runtime Library) 设置为 "多线程 /MT" (Multi-threaded /MT) 替代 /MD',
      '5. 属性 -> 子系统 设置为 "Windows (/SUBSYSTEM:WINDOWS)"',
      '6. 选择 Release x64 配置编译，生成的 .exe 可直接复制到 Win7 离线运行'
    ]
  },
  {
    id: 'system-utility-cli',
    name: '离线高性能文件处理 & 命令行工具 (单文件静态 .exe)',
    category: 'cli_tool',
    description: '无需任何 UI 的高效率控制台程序，适合对离线 Win7 上的数据、日志或文件进行批处理。',
    features: [
      'C++11 原生文件流与 Win32 文件处理',
      '静态打包后纯单文件，无第三方 DLL 依附',
      '执行速度极快，内存占用极小 (< 5MB)',
      '内置命令行参数解析与自动日志记录'
    ],
    cppCode: `#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <windows.h>

void PrintHeader() {
    std::cout << "===========================================\\n";
    std::cout << " Windows 7 离线 C++ 高性能批处理工具 v1.0 \\n";
    std::cout << "===========================================\\n\\n";
}

int main(int argc, char* argv[]) {
    // 设置控制台编码为 UTF-8 / GBK 兼容
    SetConsoleOutputCP(936); // GBK/ANSI 控制台

    PrintHeader();

    if (argc < 2) {
        std::cout << "用法: Win7Tool.exe <文件或目录路径>\\n";
        std::cout << "按任意键退出...";
        std::cin.get();
        return 1;
    }

    std::string path = argv[1];
    std::cout << "[信息] 开始处理目标: " << path << "\\n";

    // 简单文件读取测试
    std::ifstream infile(path);
    if (!infile.is_open()) {
        std::cerr << "[错误] 无法打开文件: " << path << "\\n";
        return 1;
    }

    std::string line;
    size_t lineCount = 0;
    while (std::getline(infile, line)) {
        lineCount++;
    }

    std::cout << "[成功] 处理完成! 总行数: " << lineCount << "\\n";
    return 0;
}`,
    cmakeCode: `cmake_minimum_required(VERSION 3.10)
project(Win7Tool CXX)

set(CMAKE_CXX_STANDARD 11)

if(MSVC)
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

add_executable(Win7Tool main.cpp)
`,
    mingwCommand: `g++ -O2 -std=c++11 main.cpp -o Win7Tool.exe -static -static-libgcc -static-libstdc++`,
    msvcInstructions: [
      '1. 打开 Visual Studio 新建控制台程序',
      '2. 项目属性 -> C/C++ -> 代码生成 -> 运行库 设置为 /MT',
      '3. 选择 Release x64 进行生成'
    ]
  },
  {
    id: 'qt5-gui-app',
    name: 'Qt 5 现代桌面 GUI 应用程序 (静态编译版)',
    category: 'qt_app',
    description: '如果需要漂亮的图形化界面，Qt 5.15 是 Windows 7 64位离线系统的绝佳选择。通过静态编译 Qt 库，可打包为无外部依赖的单个 .exe。',
    features: [
      '现代化跨平台 UI 组件 (支持图表、表格、图形绘制)',
      'Qt 5.15 LTS 是最后一个官方完整支持 Win7 的 Qt 版本',
      '静态编译 (Qt Static Build) 后无需携带 Qt5Core.dll 等各种动态库',
      '适合复杂的工业控制、医疗或数据可视化离线软件'
    ],
    cppCode: `#include <QApplication>
#include <QMainWindow>
#include <QPushButton>
#include <QVBoxLayout>
#include <QLabel>
#include <QMessageBox>

class MainWindow : public QMainWindow {
public:
    MainWindow() {
        QWidget *centralWidget = new QWidget(this);
        QVBoxLayout *layout = new QVBoxLayout(centralWidget);

        QLabel *label = new QLabel("Qt 5.15 静态编译 - Windows 7 离线界面程序", this);
        label->setStyleSheet("font-size: 16px; font-weight: bold; color: #2b2b2b;");

        QPushButton *btn = new QPushButton("点击测试运行", this);
        btn->setStyleSheet("padding: 8px 16px; background-color: #0284c7; color: white; border-radius: 4px;");

        layout->addWidget(label);
        layout->addWidget(btn);
        
        setCentralWidget(centralWidget);
        resize(480, 240);
        setWindowTitle("Win7 Qt5 离线程序");

        connect(btn, &QPushButton::clicked, [this]() {
            QMessageBox::information(this, "成功", "Qt 5 在 Windows 7 64位离线环境中运行良好！");
        });
    }
};

int main(int argc, char *argv[]) {
    QApplication a(argc, argv);
    MainWindow w;
    w.show();
    return a.exec();
}`,
    cmakeCode: `cmake_minimum_required(VERSION 3.16)
project(Win7QtApp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)

find_package(Qt5 REQUIRED COMPONENTS Widgets)

add_executable(Win7QtApp WIN32 main.cpp)
target_link_libraries(Win7QtApp PRIVATE Qt5::Widgets)`,
    mingwCommand: `qmake -config release CONFIG+=static && make`,
    msvcInstructions: [
      '1. 使用现成的 Qt 5.15.2 MSVC2019 64bit 静态编译包',
      '2. 使用 qmake 或 CMake 链接 static 版本的 QtWidgets',
      '3. 设置 MSVC 运行库为 /MT',
      '4. 编译后只需复制单个 .exe 文件即可在 Win7 上运行'
    ]
  }
];

export const win7CompatibilityChecks: CompatibilityCheckItem[] = [
  {
    id: 'vc-runtime',
    title: 'Visual C++ Redistributable (VC 运行库)',
    description: '普通 C++ 动态编译程序在离线 Win7 上常报 "缺少 msvcp140.dll / vcruntime140.dll" 错误。',
    status: 'critical',
    solution: '在编译器中开启静态链接选项 (/MT 参数或 MinGW -static -static-libstdc++)，将运行库直接打进 .exe 内部。'
  },
  {
    id: 'ucrt',
    title: 'Universal CRT (KB2999226 补丁)',
    description: 'VS2015 及以上版本默认使用 C 运行时 UCRT，在未打补丁的原生 Win7 上可能会报 "缺少 api-ms-win-crt-runtime-l1-1-0.dll"。',
    status: 'warning',
    solution: '推荐使用 Win32 原生 API + C++11，或者在联网编译机上将 C 运行时也静态嵌入，或准备 Windows7-KB2999226-x64.msu 补丁安装包。'
  },
  {
    id: 'arch',
    title: '目标架构匹配 (64 位 x64)',
    description: 'Windows 7 64 位系统可以兼容 32 位 (x86) 和 64 位 (x64) 可执行文件。',
    status: 'info',
    solution: '建议在编译时设置 Target 为 x64 (x86_64-w64-mingw32)，能最大化利用离线 Win7 机器的内存与 CPU 性能。'
  },
  {
    id: 'subsystem',
    title: 'Subsystem 避免黑色命令行弹窗',
    description: '桌面 GUI 程序若未设置正确的子系统，启动时会弹出一个空白命令行黑色小窗口。',
    status: 'info',
    solution: '编译 GUI 程序时添加 `-mwindows` 参数 (MinGW) 或设置 `/SUBSYSTEM:WINDOWS` (Visual Studio)。'
  }
];
