// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GasProfilingAnalysis {
    
    uint256[] public naiveArray;
    uint256[] public optimizedArray;
    uint256[] public extremeOptimizedArray;
    
    uint256 public lastGasUsed;
    
    event GasReport(string version, uint256 gasUsed);
    
    function versionA_Naive(uint256 count) public {
        uint256 gasBefore = gasleft();
        
        for (uint256 i = 0; i < count; i++) {
            naiveArray.push(i);
        }
        
        uint256 gasUsed = gasBefore - gasleft();
        lastGasUsed = gasUsed;
        emit GasReport("Version A - Naive", gasUsed);
    }
    
    function versionB_Optimized(uint256 count) public {
        uint256 gasBefore = gasleft();
        
        uint256[] storage arr = optimizedArray;
        uint256 length = arr.length;
        
        for (uint256 i = 0; i < count; i++) {
            arr.push(length + i);
        }
        
        uint256 gasUsed = gasBefore - gasleft();
        lastGasUsed = gasUsed;
        emit GasReport("Version B - Optimized", gasUsed);
    }
    
    function versionC_ExtremeOptimized(uint256 count) public {
        uint256 gasBefore = gasleft();
        
        uint256[] storage arr = extremeOptimizedArray;
        uint256 startLength = arr.length;
        
        unchecked {
            for (uint256 i = 0; i < count; ++i) {
                arr.push(startLength + i);
            }
        }
        
        uint256 gasUsed = gasBefore - gasleft();
        lastGasUsed = gasUsed;
        emit GasReport("Version C - Extreme Optimized", gasUsed);
    }
    
    function resetArrays() public {
        delete naiveArray;
        delete optimizedArray;
        delete extremeOptimizedArray;
    }
    
    function getArrayLengths() public view returns (uint256, uint256, uint256) {
        return (naiveArray.length, optimizedArray.length, extremeOptimizedArray.length);
    }
    
    function compareAllVersions(uint256 count) public {
        resetArrays();
        
        versionA_Naive(count);
        uint256 gasA = lastGasUsed;
        
        versionB_Optimized(count);
        uint256 gasB = lastGasUsed;
        
        versionC_ExtremeOptimized(count);
        uint256 gasC = lastGasUsed;
        
        emit GasReport("Comparison - A vs B savings", gasA - gasB);
        emit GasReport("Comparison - A vs C savings", gasA - gasC);
        emit GasReport("Comparison - B vs C savings", gasB - gasC);
    }
}

contract ExecutionTraceAnalysis {
    
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    address public owner;
    bool public paused;
    
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event StateChange(string action, uint256 value);
    
    constructor() {
        owner = msg.sender;
        totalSupply = 1000000;
        balances[msg.sender] = totalSupply;
        paused = false;
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(!paused, "Contract is paused");
        require(to != address(0), "Invalid recipient");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        uint256 senderBalance = balances[msg.sender];
        uint256 recipientBalance = balances[to];
        
        unchecked {
            balances[msg.sender] = senderBalance - amount;
            balances[to] = recipientBalance + amount;
        }
        
        emit Transfer(msg.sender, to, amount);
        emit StateChange("Transfer completed", amount);
        
        return true;
    }
    
    function complexFunction(uint256 x) public returns (uint256) {
        require(x > 0, "X must be positive");
        
        uint256 result = 0;
        uint256 temp = x;
        
        if (temp > 100) {
            result = temp * 2;
            emit StateChange("Branch A: multiply by 2", result);
        } else if (temp > 50) {
            result = temp + 50;
            emit StateChange("Branch B: add 50", result);
        } else {
            result = temp;
            emit StateChange("Branch C: no change", result);
        }
        
        for (uint256 i = 0; i < 3; i++) {
            result += i;
        }
        
        balances[msg.sender] += result;
        
        return result;
    }
    
    function storageHeavyOperation() public {
        uint256 value1 = balances[msg.sender];
        uint256 value2 = totalSupply;
        bool value3 = paused;
        
        balances[msg.sender] = value1 + 100;
        totalSupply = value2 + 100;
        paused = !value3;
        
        emit StateChange("Storage updated", balances[msg.sender]);
    }
    
    function memoryIntensiveOperation(uint256 size) public pure returns (uint256[] memory) {
        uint256[] memory tempArray = new uint256[](size);
        
        for (uint256 i = 0; i < size; i++) {
            tempArray[i] = i * 2;
        }
        
        return tempArray;
    }
}

contract GasRefundDemo {
    
    mapping(address => uint256) public data;
    uint256 public counter;
    
    event RefundInfo(string operation, uint256 gasBefore, uint256 gasAfter, int256 refund);
    
    function setNonZeroToNonZero(uint256 value) public {
        uint256 gasBefore = gasleft();
        data[msg.sender] = value;
        uint256 gasAfter = gasleft();
        
        emit RefundInfo("NonZero to NonZero", gasBefore, gasAfter, 0);
    }
    
    function setZeroToNonZero(uint256 value) public {
        uint256 gasBefore = gasleft();
        
        address tempAddr = address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)))));
        data[tempAddr] = value;
        
        uint256 gasAfter = gasleft();
        emit RefundInfo("Zero to NonZero (20000 gas)", gasBefore, gasAfter, 0);
    }
    
    function setNonZeroToZero() public {
        uint256 gasBefore = gasleft();
        
        require(data[msg.sender] != 0, "Already zero");
        delete data[msg.sender];
        
        uint256 gasAfter = gasleft();
        emit RefundInfo("NonZero to Zero (refund)", gasBefore, gasAfter, 4800);
    }
    
    function demonstrateEIP2929() public {
        uint256 gasBefore = gasleft();
        
        uint256 gas1 = gasleft();
        
        uint256 gas2 = gasleft();
        
        uint256 gas3 = gasleft();
        
        emit RefundInfo("Cold SLOAD", gasBefore, gas1, int256(gasBefore - gas1));
        emit RefundInfo("Warm SLOAD 1", gas1, gas2, int256(gas1 - gas2));
        emit RefundInfo("Warm SLOAD 2", gas2, gas3, int256(gas2 - gas3));
    }
}