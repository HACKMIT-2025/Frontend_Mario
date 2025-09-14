#!/usr/bin/env bash

# ==============================================================================
# Claude Code 环境变量清理脚本
# 支持 macOS 和 Linux 系统的环境变量清理
# ==============================================================================

# ANSI 颜色代码
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# 显示彩色消息
print_info() {
    echo -e "${WHITE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检测操作系统
detect_os() {
    local os_type=""
    
    # 检测 macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        os_type="macos"
    # 检测 Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # 进一步检测 Linux 发行版
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            os_type="linux-$ID"
        else
            os_type="linux-unknown"
        fi
    # 检测 WSL
    elif grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null; then
        os_type="wsl"
    else
        os_type="unknown"
    fi
    
    echo "$os_type"
}

# 获取用户 shell 配置文件列表
get_shell_configs() {
    local os_type=$1
    local configs=()
    
    case "$os_type" in
        macos)
            # macOS 优先使用 .zshrc (默认 shell)
            configs=(
                "$HOME/.zshrc"
                "$HOME/.bash_profile"
                "$HOME/.bashrc"
                "$HOME/.profile"
            )
            ;;
        linux-*|wsl)
            # Linux 系统优先使用 .bashrc
            configs=(
                "$HOME/.bashrc"
                "$HOME/.bash_profile"
                "$HOME/.zshrc"
                "$HOME/.profile"
            )
            ;;
        *)
            # 默认配置
            configs=(
                "$HOME/.bashrc"
                "$HOME/.bash_profile"
                "$HOME/.zshrc"
                "$HOME/.profile"
            )
            ;;
    esac
    
    echo "${configs[@]}"
}

# 检测已安装的环境变量
detect_env_vars() {
    print_info "检测系统中的 Claude 环境变量配置..."
    echo
    
    local found_configs=()
    local os_type=$(detect_os)
    
    print_info "检测到操作系统: $os_type"
    echo
    
    # 检查当前会话的环境变量
    print_info "当前会话的环境变量："
    local session_found=false
    if [ -n "$ANTHROPIC_BASE_URL" ]; then
        echo "  ✓ ANTHROPIC_BASE_URL=$ANTHROPIC_BASE_URL"
        session_found=true
    fi
    if [ -n "$ANTHROPIC_AUTH_TOKEN" ]; then
        echo "  ✓ ANTHROPIC_AUTH_TOKEN=${ANTHROPIC_AUTH_TOKEN:0:10}..."
        session_found=true
    fi
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo "  ✓ ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:0:10}..."
        session_found=true
    fi
    if [ "$session_found" = false ]; then
        echo "  未发现活动的环境变量"
    fi
    echo
    
    # 检查用户配置文件
    print_info "检查用户配置文件："
    local shell_configs=($(get_shell_configs "$os_type"))
    
    for config in "${shell_configs[@]}"; do
        if [ -f "$config" ]; then
            if grep -q "ANTHROPIC" "$config" 2>/dev/null; then
                echo "  ✓ $config - 发现 Claude 配置"
                found_configs+=("$config")
            fi
        fi
    done
    
    if [ ${#found_configs[@]} -eq 0 ]; then
        echo "  未在用户配置文件中发现 Claude 配置"
    fi
    echo
    
    # 检查系统级配置（仅 Linux）
    if [[ "$os_type" == linux-* ]] || [[ "$os_type" == "wsl" ]]; then
        print_info "检查系统级配置文件："
        if [ -f "/etc/environment" ]; then
            if grep -q "ANTHROPIC" "/etc/environment" 2>/dev/null; then
                echo "  ✓ /etc/environment - 发现 Claude 配置"
                found_configs+=("/etc/environment")
            else
                echo "  /etc/environment - 未发现 Claude 配置"
            fi
        fi
        echo
    fi
    
    # 返回结果
    if [ ${#found_configs[@]} -gt 0 ] || [ "$session_found" = true ]; then
        return 0  # 发现配置
    else
        return 1  # 未发现配置
    fi
}

# 清理用户级环境变量
clean_user_env() {
    local os_type=$1
    print_info "清理用户级环境变量..."
    
    local cleaned=false
    local shell_configs=($(get_shell_configs "$os_type"))
    
    for config in "${shell_configs[@]}"; do
        if [ -f "$config" ]; then
            # 检查是否包含 Anthropic 配置
            if grep -q "ANTHROPIC" "$config" 2>/dev/null; then
                print_info "处理 $config"
                
                # 创建备份
                local backup_file="$config.claude-backup-$(date +%Y%m%d_%H%M%S)"
                cp "$config" "$backup_file"
                print_success "已创建备份: $backup_file"
                
                # 删除 Anthropic 相关配置
                # macOS 的 sed 需要不同的语法
                if [[ "$os_type" == "macos" ]]; then
                    sed -i '' '/# Anthropic API Configuration/d' "$config"
                    sed -i '' '/ANTHROPIC_BASE_URL/d' "$config"
                    sed -i '' '/ANTHROPIC_AUTH_TOKEN/d' "$config"
                    sed -i '' '/ANTHROPIC_API_KEY/d' "$config"
                    # 清理可能的空行
                    sed -i '' '/^[[:space:]]*$/d' "$config"
                else
                    sed -i '/# Anthropic API Configuration/d' "$config"
                    sed -i '/ANTHROPIC_BASE_URL/d' "$config"
                    sed -i '/ANTHROPIC_AUTH_TOKEN/d' "$config"
                    sed -i '/ANTHROPIC_API_KEY/d' "$config"
                    # 清理可能的空行
                    sed -i '/^[[:space:]]*$/N;/\n[[:space:]]*$/d' "$config"
                fi
                
                print_success "已清理 $config"
                cleaned=true
            fi
        fi
    done
    
    if [ "$cleaned" = false ]; then
        print_info "未在用户配置文件中发现需要清理的内容"
    fi
}

# 清理系统级环境变量（仅 Linux）
clean_system_env() {
    local os_type=$1
    
    # macOS 不需要清理系统级环境变量
    if [[ "$os_type" == "macos" ]]; then
        print_info "macOS 系统不需要清理系统级环境变量"
        return
    fi
    
    print_info "检查系统级环境变量..."
    
    # 检查是否有 sudo 权限
    local has_sudo=false
    if [ "$EUID" -eq 0 ]; then
        has_sudo=true
    elif command -v sudo &> /dev/null && sudo -n true 2>/dev/null; then
        has_sudo=true
    fi
    
    if [ "$has_sudo" = false ]; then
        print_warning "需要 sudo 权限来清理系统级环境变量"
        read -p "是否尝试获取 sudo 权限？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! sudo -v; then
                print_error "无法获取 sudo 权限，跳过系统级清理"
                return
            fi
        else
            print_info "跳过系统级清理"
            return
        fi
    fi
    
    # 清理 /etc/environment
    if [ -f "/etc/environment" ]; then
        if grep -q "ANTHROPIC" "/etc/environment" 2>/dev/null; then
            print_info "处理 /etc/environment"
            
            # 创建备份
            local backup_file="/etc/environment.claude-backup-$(date +%Y%m%d_%H%M%S)"
            sudo cp "/etc/environment" "$backup_file"
            print_success "已创建备份: $backup_file"
            
            # 删除 Anthropic 相关配置
            sudo sed -i '/ANTHROPIC_BASE_URL/d' "/etc/environment"
            sudo sed -i '/ANTHROPIC_AUTH_TOKEN/d' "/etc/environment"
            sudo sed -i '/ANTHROPIC_API_KEY/d' "/etc/environment"
            
            print_success "已清理 /etc/environment"
        else
            print_info "/etc/environment 中未发现需要清理的内容"
        fi
    fi
}

# 清理 Claude 包装器脚本
clean_claude_wrapper() {
    print_info "检查并清理 Claude 包装器脚本..."
    
    # 检查是否存在包装器脚本
    local wrapper_found=false
    
    # 检查系统级包装器
    if [ -f "/usr/bin/claude" ]; then
        # 检查是否是包装器脚本（包含特定字符串）
        if grep -q "Claude CLI 智能包装器" "/usr/bin/claude" 2>/dev/null; then
            print_info "发现系统级 Claude 包装器脚本"
            wrapper_found=true
            
            # 检查是否有原始备份
            if [ -f "/usr/bin/claude.original" ]; then
                print_info "发现原始 claude 命令备份"
                
                # 需要 sudo 权限
                if [ "$EUID" -eq 0 ] || (command -v sudo &> /dev/null && sudo -n true 2>/dev/null); then
                    print_info "恢复原始 claude 命令..."
                    if [ "$EUID" -eq 0 ]; then
                        mv /usr/bin/claude.original /usr/bin/claude
                    else
                        sudo mv /usr/bin/claude.original /usr/bin/claude
                    fi
                    print_success "已恢复原始 claude 命令"
                else
                    print_warning "需要 sudo 权限来恢复原始命令"
                    print_info "您可以手动运行: sudo mv /usr/bin/claude.original /usr/bin/claude"
                fi
            else
                # 没有备份，直接删除包装器
                if [ "$EUID" -eq 0 ] || (command -v sudo &> /dev/null && sudo -n true 2>/dev/null); then
                    if [ "$EUID" -eq 0 ]; then
                        rm -f /usr/bin/claude
                    else
                        sudo rm -f /usr/bin/claude
                    fi
                    print_success "已删除 Claude 包装器脚本"
                else
                    print_warning "需要 sudo 权限来删除包装器脚本"
                fi
            fi
        fi
    fi
    
    # 检查用户级包装器
    if [ -f "$HOME/.local/bin/claude" ]; then
        if grep -q "Claude CLI 智能包装器" "$HOME/.local/bin/claude" 2>/dev/null; then
            print_info "发现用户级 Claude 包装器脚本"
            rm -f "$HOME/.local/bin/claude"
            print_success "已删除用户级包装器脚本"
            wrapper_found=true
        fi
    fi
    
    # 清理 claude-ai 备用命令
    if [ -f "/usr/local/bin/claude-ai" ]; then
        if [ "$EUID" -eq 0 ] || (command -v sudo &> /dev/null && sudo -n true 2>/dev/null); then
            if [ "$EUID" -eq 0 ]; then
                rm -f /usr/local/bin/claude-ai
            else
                sudo rm -f /usr/local/bin/claude-ai
            fi
            print_success "已删除 claude-ai 备用命令"
        fi
    fi
    
    if [ -f "$HOME/.local/bin/claude-ai" ]; then
        rm -f "$HOME/.local/bin/claude-ai"
        print_success "已删除用户级 claude-ai 备用命令"
    fi
    
    # 清理恢复脚本
    if [ -f "/usr/local/bin/claude-restore" ]; then
        if [ "$EUID" -eq 0 ] || (command -v sudo &> /dev/null && sudo -n true 2>/dev/null); then
            if [ "$EUID" -eq 0 ]; then
                rm -f /usr/local/bin/claude-restore
            else
                sudo rm -f /usr/local/bin/claude-restore
            fi
            print_success "已删除 claude-restore 脚本"
        fi
    fi
    
    if [ -f "$HOME/.local/bin/claude-restore" ]; then
        rm -f "$HOME/.local/bin/claude-restore"
        print_success "已删除用户级 claude-restore 脚本"
    fi
    
    if [ "$wrapper_found" = false ]; then
        print_info "未发现 Claude 包装器脚本"
    fi
}

# 清理当前会话的环境变量
clean_current_session() {
    print_info "清理当前会话的环境变量..."
    
    unset ANTHROPIC_BASE_URL
    unset ANTHROPIC_AUTH_TOKEN
    unset ANTHROPIC_API_KEY
    
    print_success "已清理当前会话的环境变量"
}

# 使清理立即生效
apply_cleanup_immediately() {
    local os_type=$1
    print_info "使清理立即生效..."
    
    # 获取当前使用的 shell 配置文件
    local current_shell_config=""
    if [[ "$os_type" == "macos" ]]; then
        if [[ "$SHELL" == *"zsh"* ]]; then
            current_shell_config="$HOME/.zshrc"
        else
            current_shell_config="$HOME/.bash_profile"
        fi
    else
        # Linux 系统
        if [[ "$SHELL" == *"zsh"* ]]; then
            current_shell_config="$HOME/.zshrc"
        else
            current_shell_config="$HOME/.bashrc"
        fi
    fi
    
    # 尝试重新加载配置文件
    if [ -f "$current_shell_config" ]; then
        print_info "重新加载配置文件: $current_shell_config"
        
        # 使用子 shell 来避免影响当前环境
        (
            # 重新加载配置
            source "$current_shell_config" 2>/dev/null || true
            
            # 检查是否还有环境变量
            if [ -z "$ANTHROPIC_BASE_URL" ] && [ -z "$ANTHROPIC_AUTH_TOKEN" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
                echo "RELOAD_SUCCESS"
            fi
        ) | grep -q "RELOAD_SUCCESS" && print_success "配置文件已重新加载"
    fi
    
    # 再次确保当前 shell 中的环境变量被清除
    unset ANTHROPIC_BASE_URL
    unset ANTHROPIC_AUTH_TOKEN  
    unset ANTHROPIC_API_KEY
    
    # 导出空值以覆盖任何可能的继承值
    export ANTHROPIC_BASE_URL=""
    export ANTHROPIC_AUTH_TOKEN=""
    export ANTHROPIC_API_KEY=""
    
    # 然后再次 unset
    unset ANTHROPIC_BASE_URL
    unset ANTHROPIC_AUTH_TOKEN
    unset ANTHROPIC_API_KEY
    
    print_success "环境变量清理已立即生效"
    
    # 提示用户如何验证
    print_info "您可以运行以下命令验证清理效果："
    echo "  echo \$ANTHROPIC_BASE_URL   # 应该为空"
    echo "  echo \$ANTHROPIC_AUTH_TOKEN # 应该为空"
    echo "  env | grep ANTHROPIC        # 应该无输出"
}

# 验证清理结果
verify_cleanup() {
    local os_type=$1
    print_info "验证清理结果..."
    echo
    
    local all_clean=true
    
    # 1. 验证当前会话环境变量
    print_info "检查当前会话环境变量："
    if [ -n "$ANTHROPIC_BASE_URL" ] || [ -n "$ANTHROPIC_AUTH_TOKEN" ] || [ -n "$ANTHROPIC_API_KEY" ]; then
        print_error "✗ 当前会话仍存在环境变量（需要重启终端才能完全清除）"
        all_clean=false
    else
        print_success "✓ 当前会话环境变量已清理"
    fi
    echo
    
    # 2. 验证用户配置文件
    print_info "检查用户配置文件："
    local shell_configs=($(get_shell_configs "$os_type"))
    local user_clean=true
    
    for config in "${shell_configs[@]}"; do
        if [ -f "$config" ]; then
            if grep -q "ANTHROPIC" "$config" 2>/dev/null; then
                print_error "✗ $config - 仍包含 Claude 配置"
                user_clean=false
                all_clean=false
            fi
        fi
    done
    
    if [ "$user_clean" = true ]; then
        print_success "✓ 所有用户配置文件已清理干净"
    fi
    echo
    
    # 3. 验证系统级配置（仅 Linux）
    if [[ "$os_type" != "macos" ]]; then
        print_info "检查系统级配置文件："
        if [ -f "/etc/environment" ]; then
            if grep -q "ANTHROPIC" "/etc/environment" 2>/dev/null; then
                print_error "✗ /etc/environment - 仍包含 Claude 配置"
                all_clean=false
            else
                print_success "✓ 系统级配置文件已清理干净"
            fi
        else
            print_success "✓ 无系统级配置文件"
        fi
        echo
    fi
    
    # 4. 最终验证结果
    echo
    if [ "$all_clean" = true ]; then
        print_success "🎉 验证通过！所有 Claude 环境变量已成功清理"
        return 0
    else
        print_warning "⚠️  部分清理未完成，可能需要手动处理或重启终端"
        return 1
    fi
}

# 显示清理总结
show_summary() {
    local os_type=$1
    
    echo
    print_success "环境变量清理完成！"
    echo
    print_info "清理总结："
    echo "  • 已清理用户配置文件中的 Claude 环境变量"
    if [[ "$os_type" != "macos" ]]; then
        echo "  • 已清理系统级配置文件中的 Claude 环境变量"
    fi
    echo "  • 已清理当前会话的环境变量"
    echo "  • 环境变量清理已立即生效"
    echo "  • 所有修改的文件都已创建备份"
    echo
    print_info "后续步骤："
    echo "  1. 如果要在新终端中验证，请打开新终端窗口"
    echo "  2. 运行 'env | grep ANTHROPIC' 确认清理效果"
    echo
    print_info "备份文件："
    echo "  查看备份: ls -la ~/*.claude-backup-*"
    echo "  恢复备份示例: cp ~/.bashrc.claude-backup-* ~/.bashrc"
    echo
}

# 主函数
main() {
    clear
    echo -e "${WHITE}"
    echo "================================================"
    echo "    🧹 Claude Code 环境变量清理工具    "
    echo "================================================"
    echo -e "${NC}"
    
    # 检测操作系统
    local os_type=$(detect_os)
    
    # 检测环境变量
    if ! detect_env_vars; then
        echo
        print_warning "未检测到任何 Claude 环境变量配置"
        print_info "系统已经是清理状态，无需进行清理操作"
        exit 0
    fi
    
    # 询问用户是否继续
    echo
    read -p "是否继续清理所有检测到的 Claude 环境变量？(y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "已取消清理操作"
        exit 0
    fi
    
    echo
    print_info "开始清理流程..."
    echo
    
    # 执行清理
    clean_user_env "$os_type"
    echo
    
    clean_system_env "$os_type"
    echo
    
    clean_claude_wrapper
    echo
    
    clean_current_session
    echo
    
    # 使清理立即生效
    apply_cleanup_immediately "$os_type"
    echo
    
    # 验证清理结果
    verify_cleanup "$os_type"
    
    # 显示总结
    show_summary "$os_type"
}

# 运行主函数
main "$@"